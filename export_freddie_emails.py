#!/usr/bin/env python3
"""
Gmail Export Script for Freddie/Widegate Litigation Analysis
Exports emails from:freddie or mentioning 19 First Avenue
"""

import os
import json
import base64
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Scopes required
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_credentials():
    """Get valid user credentials from storage."""
    creds = None
    token_path = '/Users/ayrtonmansi/.openclaw/workspace/gmail_token.pickle'
    
    # Load existing token
    if os.path.exists(token_path):
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)
    
    # If no valid credentials, get them
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Use the client secrets from gogcli - need to reformat
            import json
            client_secrets_path = '/Users/ayrtonmansi/Library/Application Support/gogcli/credentials.json'
            with open(client_secrets_path) as f:
                creds_data = json.load(f)
            
            # Create proper client secrets format
            client_config = {
                "installed": {
                    "client_id": creds_data["client_id"],
                    "client_secret": creds_data["client_secret"],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
                }
            }
            
            flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save token
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)
    
    return creds

def export_emails():
    """Export Freddie/Widegate emails."""
    try:
        creds = get_credentials()
        service = build('gmail', 'v1', credentials=creds)
        
        # Search for ALL project-relevant emails (broader capture)
        query = 'subject:"19 First" OR subject:"First Avenue" OR subject:"17-19" OR subject:"17&19" OR subject:mortgage OR subject:construction OR subject:development OR subject:certane OR subject:promax OR subject:widegate OR subject:freddie OR from:freddie OR to:freddie OR from:certane OR to:certane OR from:promax OR to:promax OR from:widegate OR to:widegate OR subject:"building contract" OR subject:"development approval" OR subject:DA OR subject:MCU'
        
        print(f"Searching with query: {query}")
        
        results = service.users().messages().list(
            userId='me', 
            q=query,
            maxResults=500
        ).execute()
        
        messages = results.get('messages', [])
        
        if not messages:
            print("No messages found.")
            return
        
        print(f"Found {len(messages)} messages. Exporting...")
        
        output_dir = '/Users/ayrtonmansi/.openclaw/workspace/freddie_emails'
        os.makedirs(output_dir, exist_ok=True)
        
        exported = []
        
        for i, msg in enumerate(messages):
            try:
                message = service.users().messages().get(
                    userId='me', 
                    id=msg['id'],
                    format='full'
                ).execute()
                
                # Extract headers
                headers = message['payload']['headers']
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                from_addr = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
                
                # Save email data
                filename = f"email_{i:04d}_{msg['id']}.json"
                filepath = os.path.join(output_dir, filename)
                
                with open(filepath, 'w') as f:
                    json.dump({
                        'id': msg['id'],
                        'subject': subject,
                        'from': from_addr,
                        'date': date,
                        'snippet': message.get('snippet', ''),
                        'payload': message['payload']
                    }, f, indent=2)
                
                exported.append({
                    'id': msg['id'],
                    'subject': subject,
                    'from': from_addr,
                    'date': date,
                    'file': filename
                })
                
                print(f"Exported: {date} - {subject[:60]}")
                
            except Exception as e:
                print(f"Error exporting message {msg['id']}: {e}")
                continue
        
        # Save index
        with open(os.path.join(output_dir, 'index.json'), 'w') as f:
            json.dump(exported, f, indent=2)
        
        print(f"\nExported {len(exported)} emails to {output_dir}")
        print(f"Index saved to: {output_dir}/index.json")
        
    except HttpError as error:
        print(f'An error occurred: {error}')

if __name__ == '__main__':
    export_emails()
