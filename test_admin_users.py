"""
Test script for GET /api/admin/products endpoint
This script tests the admin products API by:
1. Logging in as an admin user to get auth token
2. Calling the /api/admin/products endpoint
3. Displaying the results
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"


def format_currency(amount):
    """Format amount as Nigerian Naira"""
    return f"₦{amount:,.2f}"


def test_admin_products():
    print("=" * 60)
    print("Testing GET /api/admin/products endpoint")
    print("=" * 60)
    
    # Step 1: Login as admin to get token
    print("\n[Step 1] Logging in as admin...")
    
    login_data = {
        "email": "johndoe@example.com",
        "password": "password123"
    }
    
    try:
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get("token")
            print(f"✅ Login successful!")
            print(f"   User: {login_result.get('firstName')} {login_result.get('lastName')}")
            print(f"   Role: {login_result.get('role')}")
        elif login_response.status_code == 401:
            print("❌ Login failed - Invalid credentials")
            print("   Creating admin user first...")
            
            # Register admin user
            register_data = {
                "firstName": "Admin",
                "lastName": "User",
                "email": "admin@stylestore.com",
                "password": "admin123",
                "role": "admin"
            }
            
            register_response = requests.post(
                f"{BASE_URL}/auth/register",
                json=register_data,
                headers={"Content-Type": "application/json"}
            )
            
            if register_response.status_code == 201:
                login_result = register_response.json()
                token = login_result.get("token")
                print(f"✅ Admin user created and logged in!")
                print(f"   User: {login_result.get('firstName')} {login_result.get('lastName')}")
                print(f"   Role: {login_result.get('role')}")
            else:
                print(f"❌ Failed to register admin: {register_response.text}")
                return
        else:
            print(f"❌ Login failed with status {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            return
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Server is not running on localhost:5000")
        print("   Please start the server with: cd server && npm run dev")
        return
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return
    
    # Step 2: Call the admin/products endpoint
    print("\n[Step 2] Calling GET /api/admin/products...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # First test: Get all products
        products_response = requests.get(
            f"{BASE_URL}/products",
            headers=headers
        )
        
        print(f"\n📊 Response Status: {products_response.status_code}")
        
        if products_response.status_code == 200:
            result = products_response.json()
            print(f"✅ Success!")
            
            # Handle both array and paginated response
            if isinstance(result, list):
                products = result
                total = len(products)
                page = 1
                pages = 1
            else:
                products = result.get('products', [])
                total = result.get('total', len(products))
                page = result.get('page', 1)
                pages = result.get('pages', 1)
            
            print(f"\n📋 Response Data:")
            print("-" * 60)
            print(f"   Total Products: {total}")
            print(f"   Page: {page}")
            print(f"   Total Pages: {pages}")
            
            print(f"\n🛍️  Products ({len(products)} on this page):")
            print("-" * 60)
            
            if products:
                for i, product in enumerate(products, 1):
                    images = product.get('images', [])
                    image_count = len(images) if images else 0
                    sizes = product.get('sizes', [])
                    colors = product.get('colors', [])
                    
                    print(f"\n   Product #{i}:")
                    print(f"   ID: {product.get('id', 'N/A')[:8]}...")
                    print(f"   Name: {product.get('name', 'N/A')}")
                    print(f"   Category: {product.get('category', 'N/A')} / {product.get('subcategory', 'N/A')}")
                    print(f"   Price: {format_currency(float(product.get('price', 0)))}")
                    if product.get('comparePrice'):
                        print(f"   Compare Price: {format_currency(float(product.get('comparePrice', 0)))}")
                    print(f"   Stock: {product.get('totalStock', 0)}")
                    print(f"   Sold: {product.get('soldCount', 0)}")
                    print(f"   Rating: {product.get('averageRating', 0)} ({product.get('reviewCount', 0)} reviews)")
                    print(f"   Images: {image_count}")
                    print(f"   Sizes: {', '.join(sizes) if sizes else 'None'}")
                    print(f"   Colors: {len(colors)} color(s)")
                    print(f"   Active: {product.get('isActive', 'N/A')}")
                    print(f"   Featured: {product.get('featured', False)}")
            else:
                print("   No products found in the database.")
                
        elif products_response.status_code == 401:
            print("❌ Unauthorized - Token may be invalid or expired")
            print(f"   Response: {products_response.text}")
        elif products_response.status_code == 403:
            print("❌ Forbidden - User doesn't have admin privileges")
            print(f"   Response: {products_response.text}")
        else:
            print(f"❌ Request failed with status {products_response.status_code}")
            print(f"   Response: {products_response.text}")
            
    except Exception as e:
        print(f"❌ Error calling products endpoint: {str(e)}")
    
    # Step 3: Test with query parameters
    print("\n[Step 3] Testing with query parameters...")
    
    # Test with category filter
    try:
        category_response = requests.get(
            f"{BASE_URL}/products?category=men&limit=5",
            headers=headers
        )
        
        if category_response.status_code == 200:
            result = category_response.json()
            products = result.get('products', result) if isinstance(result, dict) else result
            print(f"✅ Category filter (category=men&limit=5):")
            print(f"   Found {len(products)} product(s)")
        else:
            print(f"❌ Category filter failed: {category_response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing category filter: {str(e)}")
    
    # Test with search
    try:
        search_response = requests.get(
            f"{BASE_URL}/products?search=shirt",
            headers=headers
        )
        
        if search_response.status_code == 200:
            result = search_response.json()
            products = result.get('products', result) if isinstance(result, dict) else result
            print(f"✅ Search query (search=shirt):")
            print(f"   Found {len(products)} product(s)")
        else:
            print(f"❌ Search query failed: {search_response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing search: {str(e)}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)


if __name__ == "__main__":
    test_admin_products()
