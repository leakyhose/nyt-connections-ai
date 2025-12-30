import boto3
import json
import os
import time
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env'))

def create_table(dynamodb):
    try:
        table = dynamodb.create_table(
            TableName='ConnectionsGames',
            KeySchema=[
                {
                    'AttributeName': 'game_number',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'game_number',
                    'AttributeType': 'N'
                }
            ],
            BillingMode="PAY_PER_REQUEST"
        )
        print("Creating table...")
        table.wait_until_exists()
        print("Table created.")
        return table
    except Exception as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Table already exists.")
            return dynamodb.Table('ConnectionsGames')
        else:
            raise e

def load_data(table):
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'data')
    
    if not os.path.exists(data_dir):
        print(f"Data directory not found: {data_dir}")
        return

    files = [f for f in os.listdir(data_dir) if f.endswith('.json') and f.startswith('game_')]
    print(f"Found {len(files)} games to upload.")

    game_ids = []

    with table.batch_writer() as batch:
        for filename in files:
            with open(os.path.join(data_dir, filename), 'r') as f:
                game_data = json.load(f, parse_float=Decimal)
                
                if 'game_number' not in game_data:
                    print(f"Skipping {filename}: missing game_number")
                    continue

                try:
                    batch.put_item(Item=game_data)
                    game_ids.append(int(game_data['game_number']))
                    if len(game_ids) % 50 == 0:
                        print(f"Uploaded {len(game_ids)} games...")
                except Exception as e:
                    print(f"Error uploading game {game_data['game_number']}: {e}")

    try:
        table.put_item(Item={
            'game_number': -1,
            'available_games': game_ids
        })
        print("Uploaded metadata.")
    except Exception as e:
        print(f"Error uploading metadata: {e}")


if __name__ == '__main__':
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    
    table = create_table(dynamodb)
    load_data(table)
