from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

password = quote_plus("MySql1234")
engine = create_engine(f"mysql+pymysql://root:{password}@localhost:3306/truce_hackathon")

connection = engine.connect()

result = connection.execute(text("SHOW TABLES"))

for row in result:
    print(row)

connection.close()
