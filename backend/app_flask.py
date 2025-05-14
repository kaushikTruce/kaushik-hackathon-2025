from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import json
import google.generativeai as genai
import os
from dotenv import load_dotenv
import traceback
import logging
import sqlparse
import re
from sqlalchemy import create_engine, text, inspect
from waitress import serve

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MySQL Configuration
MYSQL_USERNAME = os.getenv('MYSQL_USERNAME')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
DB_NAME = os.getenv('DB_NAME')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')

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

def get_db_engine():
    """Get SQLAlchemy engine with connection to MySQL"""
    connection_string = f"mysql+pymysql://{MYSQL_USERNAME}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{DB_NAME}"
    return create_engine(connection_string)

# Test the database connection on startup
try:
    engine = get_db_engine()
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Database connection failed: {str(e)}")
    logger.error("Make sure MySQL is running and credentials are correct")

def sanitize_sql(sql_text):
    """Sanitize SQL query from LLM output"""
    # Extract SQL if it's wrapped in code blocks or other markers
    if "```sql" in sql_text:
        sql_parts = sql_text.split("```sql")
        if len(sql_parts) > 1:
            sql_text = sql_parts[1].split("```")[0].strip()
    elif "```" in sql_text:
        sql_parts = sql_text.split("```")
        for part in sql_parts:
            if "SELECT" in part.upper() or "WITH" in part.upper():
                sql_text = part.strip()
                break
    
    # Remove any explanatory text or comments
    lines = sql_text.split('\n')
    sql_lines = []
    for line in lines:
        if not line.strip().startswith('--'):
            sql_lines.append(line)
    
    sql_text = '\n'.join(sql_lines)
    
    return sql_text

def validate_sql(sql_query):
    """Validate SQL query using sqlparse"""
    try:
        # Parse the SQL to check if it's valid syntax
        parsed = sqlparse.parse(sql_query)
        if not parsed or not parsed[0].tokens:
            return False, "Empty or invalid SQL query"
        
        # Basic check to ensure it's a SELECT query
        stmt_type = parsed[0].get_type()
        if stmt_type.upper() != 'SELECT':
            return False, f"Expected SELECT query, got {stmt_type}"
        
        return True, "Valid SQL query"
    except Exception as e:
        return False, f"SQL validation error: {str(e)}"

def csv_to_mysql_table(df, table_name):
    """Create a new table in MySQL and populate it with CSV data"""
    engine = get_db_engine()
    
    # Clean table name (remove special chars and spaces)
    clean_table_name = re.sub(r'[^a-zA-Z0-9_]', '', table_name)
    clean_table_name = f"csv_{clean_table_name.lower()}"
    
    # Check if table exists and drop it
    inspector = inspect(engine)
    if clean_table_name in inspector.get_table_names():
        with engine.connect() as conn:
            conn.execute(text(f"DROP TABLE {clean_table_name}"))
            conn.commit()
    
    # Create table and insert data
    df.to_sql(clean_table_name, engine, if_exists='replace', index=False)
    
    # Return the clean table name
    return clean_table_name

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
        
        # Create table name from filename
        table_name = os.path.splitext(file.filename)[0]
        
        # Create MySQL table and populate with CSV data
        try:
            mysql_table_name = csv_to_mysql_table(df, table_name)
            logger.info(f"Created MySQL table: {mysql_table_name}")
        except Exception as e:
            logger.error(f"Error creating MySQL table: {str(e)}")
            return jsonify({'error': f'Error creating MySQL table: {str(e)}'}), 500
        
        # Get the prompt from the form data
        user_prompt = request.form.get('prompt', 'No prompt provided')
        
        # Create a context-aware prompt for Gemini to generate SQL
        gemini_prompt = f"""
        I have a MySQL table named '{mysql_table_name}' with the following columns: {headers}.
        
        Here's a sample of the data:
        {json.dumps(sample_data, indent=2)}
        
        Based on this data, please {user_prompt}.
        
        Your task is to:
        1. Write a SQL query (MySQL dialect) that answers this request
        2. ONLY return the SQL query, with no explanation or other text
        3. Make sure it's a properly formatted, efficient SQL query
        4. The query must only use SELECT statements (no INSERT, UPDATE, DELETE, etc.)
        
        Return ONLY the SQL query with nothing else.
        """
        
        # Get response from Gemini
        try:
            response = model.generate_content(gemini_prompt)
            response_text = response.text
            logger.info("Successfully got response from Gemini")
        except Exception as e:
            logger.error(f"Error getting response from Gemini: {str(e)}")
            return jsonify({'error': f'Error getting response from Gemini: {str(e)}'}), 500
        
        # Sanitize the SQL query
        sql_query = sanitize_sql(response_text)
        logger.info(f"Sanitized SQL query: {sql_query}")
        
        # Validate the SQL query
        is_valid, validation_message = validate_sql(sql_query)
        if not is_valid:
            logger.error(f"Invalid SQL query: {validation_message}")
            return jsonify({
                'error': f'Invalid SQL query: {validation_message}',
                'raw_query': sql_query
            }), 400
        
        print(f"Validated SQL Query: {sql_query}")
        # Execute the SQL query and get results as a pandas DataFrame
        try:
            engine = get_db_engine()
            with engine.connect() as conn:
                result_df = pd.read_sql(sql_query, conn)
            
            # Convert DataFrame to dict for JSON response
            result_data = result_df.to_dict(orient='records')
            result_headers = result_df.columns.tolist()
            
            logger.info(f"SQL query executed successfully, returned {len(result_df)} rows")
            
            return jsonify({
                'message': 'File processed successfully',
                'table_name': mysql_table_name,
                'original_headers': headers,
                'sql_query': sql_query,
                'result_headers': result_headers,
                'result_data': result_data
            })
            
        except Exception as e:
            logger.error(f"Error executing SQL query: {str(e)}")
            return jsonify({
                'error': f'Error executing SQL query: {str(e)}',
                'sql_query': sql_query
            }), 500

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # app.run(host='0.0.0.0', port=8000, debug=True)
    serve(app, host="0.0.0.0", port=8000)