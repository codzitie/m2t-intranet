from auth import create_access_token
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

try:
    # Query users directly using raw SQL
    users = db.execute(text("SELECT id, name, email FROM users LIMIT 10")).fetchall()
    
    print("\n" + "="*60)
    print("GENERATED TOKENS FOR TESTING")
    print("="*60)
    
    for user in users:
        user_id, name, email = user
        token = create_access_token(data={"sub": str(user_id)})
        
        print(f"\nUser: {name} ({email})")
        print(f"ID: {user_id}")
        print(f"Token: {token}")
        print("-" * 60)
    
finally:
    db.close()
