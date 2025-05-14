from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import json
import google.generativeai as genai
import os
from dotenv import load_dotenv
import traceback
import logging
import re
from pymongo import MongoClient
from waitress import serve

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv('MONGODB_URI')
DB_NAME = os.getenv('DB_NAME')

# Configure Gemini
try:
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
    model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17')
except Exception as e:
    logger.error(f"Error configuring Gemini: {str(e)}")
    raise

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def get_mongodb_client():
    """Get MongoDB client connection"""
    return MongoClient(MONGODB_URI)

# Test the database connection on startup
try:
    client = get_mongodb_client()
    db = client[DB_NAME]
    # Simple ping to verify connection
    client.admin.command('ping')
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Database connection failed: {str(e)}")
    logger.error("Make sure MongoDB is running and credentials are correct")

def sanitize_query(query_text):
    """Sanitize query from LLM output"""
    # Extract query if it's wrapped in code blocks or other markers
    if "```" in query_text:
        query_parts = query_text.split("```")
        for part in query_parts:
            if part.strip() and not part.strip().startswith('```'):
                query_text = part.strip()
                break
    
    # Remove any language identifiers at the beginning (like "json")
    query_text = re.sub(r'^json\s+', '', query_text)
    
    # Remove any explanatory text or comments
    lines = query_text.split('\n')
    query_lines = []
    for line in lines:
        if not line.strip().startswith('--'):
            query_lines.append(line)
    
    query_text = '\n'.join(query_lines)
    
    return query_text

def validate_query(query_json):
    """Validate MongoDB query"""
    try:
        # Parse the JSON to check if it's valid syntax
        if not query_json:
            return False, "Empty or invalid MongoDB query"
        
        # Handle both find query (dict) and aggregation pipeline (list) formats
        if not isinstance(query_json, dict) and not isinstance(query_json, list):
            return False, "Query must be a valid JSON object or array"
        
        return True, "Valid MongoDB query"
    except Exception as e:
        return False, f"Query validation error: {str(e)}"

def csv_to_mongodb_collection(df, collection_name):
    """Create a new collection in MongoDB and populate it with CSV data"""
    client = get_mongodb_client()
    db = client[DB_NAME]
    
    # Clean collection name (remove special chars and spaces)
    clean_collection_name = re.sub(r'[^a-zA-Z0-9_]', '', collection_name)
    clean_collection_name = f"csv_{clean_collection_name.lower()}"
    
    # Check if collection exists and drop it
    if clean_collection_name in db.list_collection_names():
        db[clean_collection_name].drop()
    
    # Convert DataFrame to list of records
    records = df.to_dict(orient='records')
    
    # Insert data into MongoDB
    if records:
        db[clean_collection_name].insert_many(records)
    
    # Return the clean collection name
    return clean_collection_name

@app.route('/process', methods=['POST'])
def process_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400

        # Read the CSV file using pandas
        try:
            df = pd.read_csv(file)
            logger.info(f"Successfully read CSV file with {len(df)} rows and {len(df.columns)} columns")
        except Exception as e:
            logger.error(f"Error reading CSV file: {str(e)}")
            return jsonify({'error': f'Error reading CSV file: {str(e)}'}), 400
        
        # Get basic info about the dataframe
        headers = df.columns.tolist()
        sample_data = df.head(4).to_dict(orient='records')
        
        # Create collection name from filename
        collection_name = os.path.splitext(file.filename)[0]
        
        # Create MongoDB collection and populate with CSV data
        try:
            mongodb_collection_name = csv_to_mongodb_collection(df, collection_name)
            logger.info(f"Created MongoDB collection: {mongodb_collection_name}")
        except Exception as e:
            logger.error(f"Error creating MongoDB collection: {str(e)}")
            return jsonify({'error': f'Error creating MongoDB collection: {str(e)}'}), 500
        
        # Get the prompt from the form data
        user_prompt = request.form.get('prompt', 'No prompt provided')
        
        # Create a context-aware prompt for Gemini to generate MongoDB query
        gemini_prompt = f"""
        I have a MongoDB collection named '{mongodb_collection_name}' with the following fields: {headers}.
        
        Here's a sample of the data:
        {json.dumps(sample_data, indent=2)}
        
        Based on this data, please {user_prompt}.
        
        Your task is to:
        1. Write a MongoDB query that answers this request
        2. You can use either a find query or an aggregation pipeline, whichever is more appropriate
        3. Return ONLY the MongoDB query as a JSON object or array
        4. Make sure it's a properly formatted, efficient MongoDB query
        
        For find queries, return in this format:
        {{
          "filter": {{ "age": {{ "$gt": 30 }} }},
          "sort": {{ "name": 1 }}
        }}
        
        For aggregation pipelines, return an array of stages:
        [
          {{ "$match": {{ "age": {{ "$gt": 30 }} }} }},
          {{ "$group": {{ "_id": "$city", "count": {{ "$sum": 1 }} }} }}
        ]
        
        Return ONLY the MongoDB query JSON with nothing else.
        """
        
        # Get response from Gemini
        try:
            response = model.generate_content(gemini_prompt)
            response_text = response.text
            logger.info("Successfully got response from Gemini")
        except Exception as e:
            logger.error(f"Error getting response from Gemini: {str(e)}")
            return jsonify({'error': f'Error getting response from Gemini: {str(e)}'}), 500
        
        # Sanitize the MongoDB query
        clean_query_text = sanitize_query(response_text)
        logger.info(f"Sanitized MongoDB query: {clean_query_text}")
        
        # Parse the JSON query
        try:
            query_params = json.loads(clean_query_text)
        except Exception as e:
            logger.error(f"Error parsing MongoDB query JSON: {str(e)}")
            return jsonify({
                'error': f'Error parsing MongoDB query JSON: {str(e)}',
                'raw_query': clean_query_text
            }), 400
        
        # Validate the MongoDB query
        is_valid, validation_message = validate_query(query_params)
        if not is_valid:
            logger.error(f"Invalid MongoDB query: {validation_message}")
            return jsonify({
                'error': f'Invalid MongoDB query: {validation_message}',
                'raw_query': clean_query_text
            }), 400
        
        print(f"Validated MongoDB Query: {clean_query_text}")
        
        # Execute the MongoDB query and get results
        try:
            client = get_mongodb_client()
            db = client[DB_NAME]
            collection = db[mongodb_collection_name]
            
            # Check if query is an aggregation pipeline (list) or find query (dict)
            if isinstance(query_params, list):
                # Execute aggregation pipeline
                cursor = collection.aggregate(query_params)
                result_data = list(cursor)
            else:
                # Extract query parameters for find
                filter_params = query_params.get('filter', {})
                sort_params = query_params.get('sort', None)
                limit_value = query_params.get('limit', 0)
                projection = query_params.get('projection', None)
                
                # Execute find query
                cursor = collection.find(filter_params, projection)
                
                # Apply sort if specified
                if sort_params:
                    cursor = cursor.sort(list(sort_params.items()))
                
                # Apply limit if specified
                if limit_value > 0:
                    cursor = cursor.limit(limit_value)
                
                # Convert cursor to list
                result_data = list(cursor)
            
            # MongoDB adds _id field that's not JSON serializable, so convert it
            for doc in result_data:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
            
            # Get result headers (fields)
            result_headers = list(result_data[0].keys()) if result_data else []
            
            logger.info(f"MongoDB query executed successfully, returned {len(result_data)} documents")
            
            return jsonify({
                'message': 'File processed successfully',
                'collection_name': mongodb_collection_name,
                'original_headers': headers,
                'mongodb_query': query_params,
                'result_headers': result_headers,
                'result_data': result_data
            })
            
        except Exception as e:
            logger.error(f"Error executing MongoDB query: {str(e)}")
            return jsonify({
                'error': f'Error executing MongoDB query: {str(e)}',
                'mongodb_query': query_params
            }), 500

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # app.run(host='0.0.0.0', port=8000, debug=True)
    serve(app, host="0.0.0.0", port=8000)