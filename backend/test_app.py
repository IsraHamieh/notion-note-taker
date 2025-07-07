#!/usr/bin/env python3
"""
Test script for the Notion Agent FastAPI application.
"""

import requests
import json
import os

def test_health_endpoint():
    """Test the health check endpoint."""
    try:
        response = requests.get('http://localhost:5000/api/health')
        print(f"Health check status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_upload_endpoint():
    """Test the file upload endpoint."""
    try:
        # Create a test file
        test_file_path = 'test_document.txt'
        with open(test_file_path, 'w') as f:
            f.write("This is a test document for the Notion Agent.")
        
        with open(test_file_path, 'rb') as f:
            files = {'files': f}
            response = requests.post('http://localhost:5000/api/upload', files=files)
        
        print(f"Upload test status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Clean up
        os.remove(test_file_path)
        return response.status_code == 200
    except Exception as e:
        print(f"Upload test failed: {e}")
        return False

def test_process_endpoint():
    """Test the main process endpoint."""
    try:
        data = {
            'user_query': 'Create a simple Notion page about AI',
            'web_search_query': '',
            'use_image_content': 'false',
            'youtube_urls': '[]'
        }
        
        response = requests.post('http://localhost:5000/api/process', data=data)
        print(f"Process test status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Process test failed: {e}")
        return False

def test_fastapi_docs():
    """Test if FastAPI docs are accessible."""
    try:
        response = requests.get('http://localhost:5000/docs')
        print(f"FastAPI docs status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"FastAPI docs test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Notion Agent FastAPI Application")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    health_ok = test_health_endpoint()
    
    # Test upload endpoint
    print("\n2. Testing upload endpoint...")
    upload_ok = test_upload_endpoint()
    
    # Test process endpoint
    print("\n3. Testing process endpoint...")
    process_ok = test_process_endpoint()
    
    # Test FastAPI docs
    print("\n4. Testing FastAPI docs...")
    docs_ok = test_fastapi_docs()
    
    print("\n" + "=" * 50)
    print("Test Results:")
    print(f"Health endpoint: {'✓' if health_ok else '✗'}")
    print(f"Upload endpoint: {'✓' if upload_ok else '✗'}")
    print(f"Process endpoint: {'✓' if process_ok else '✗'}")
    print(f"FastAPI docs: {'✓' if docs_ok else '✗'}")
    
    if all([health_ok, upload_ok, process_ok, docs_ok]):
        print("\nAll tests passed! The FastAPI application is working correctly.")
        print("\nYou can view the API documentation at: http://localhost:5000/docs")
    else:
        print("\nSome tests failed. Please check the application setup.") 