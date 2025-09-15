#!/usr/bin/env python3
"""
Simple HTTP server for GC Spends API Documentation
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def serve_docs(port=8001):
    """Serve the API documentation on the specified port"""
    
    # Change to the swagger directory
    swagger_dir = Path(__file__).parent
    os.chdir(swagger_dir)
    
    # Create a custom handler that serves files with proper MIME types
    class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            # Add CORS headers
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            super().end_headers()
        
        def guess_type(self, path):
            """Override to set correct MIME types"""
            result = super().guess_type(path)
            if isinstance(result, tuple):
                mimetype, encoding = result
            else:
                mimetype = result
                encoding = None
            
            if path.endswith('.json'):
                return 'application/json'
            return mimetype
    
    # Start the server
    with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
        print(f"🚀 GC Spends API Documentation Server")
        print(f"📁 Serving from: {swagger_dir}")
        print(f"🌐 Server running at: http://localhost:{port}")
        print(f"📖 OpenAPI UI: http://localhost:{port}/index.html")
        print(f"📚 API Reference: http://localhost:{port}/api-reference.html")
        print(f"📄 OpenAPI JSON: http://localhost:{port}/openapi.json")
        print(f"⏹️  Press Ctrl+C to stop the server")
        print("-" * 60)
        
        # Try to open the browser automatically
        try:
            webbrowser.open(f'http://localhost:{port}/index.html')
            print("🌐 Browser opened automatically")
        except:
            print("⚠️  Could not open browser automatically")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            sys.exit(0)

if __name__ == "__main__":
    port = 8001
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ Invalid port number. Using default port 8001")
    
    serve_docs(port)
