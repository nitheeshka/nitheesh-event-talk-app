import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# URL of the BigQuery Release Notes XML feed
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    # Adding User-Agent to avoid potential HTTP 403 Forbidden errors
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    req = urllib.request.Request(FEED_URL, headers=headers)
    
    with urllib.request.urlopen(req, timeout=15) as response:
        xml_data = response.read()
    
    # Parse XML data
    root = ET.fromstring(xml_data)
    
    # Handle XML namespaces if present (e.g. Atom namespace)
    namespace = root.tag.split("}")[0] + "}" if root.tag.startswith("{") else ""
    
    entries = []
    for entry_node in root.findall(f"{namespace}entry"):
        # Extract ID
        id_node = entry_node.find(f"{namespace}id")
        entry_id = id_node.text if id_node is not None else ""
        
        # Extract title (usually the date, e.g. "June 16, 2026")
        title_node = entry_node.find(f"{namespace}title")
        title = title_node.text if title_node is not None else ""
        
        # Extract updated timestamp
        updated_node = entry_node.find(f"{namespace}updated")
        updated = updated_node.text if updated_node is not None else ""
        
        # Extract link (usually relative or absolute web link)
        link_node = entry_node.find(f"{namespace}link")
        link = link_node.attrib.get("href", "") if link_node is not None else ""
        
        # Extract content HTML
        content_node = entry_node.find(f"{namespace}content")
        content = content_node.text if content_node is not None else ""
        
        entries.append({
            "id": entry_id,
            "title": title,
            "updated": updated,
            "link": link,
            "content": content
        })
        
    return entries

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/release-notes")
def get_release_notes():
    try:
        entries = fetch_and_parse_feed()
        return jsonify({
            "success": True, 
            "count": len(entries),
            "entries": entries
        })
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
