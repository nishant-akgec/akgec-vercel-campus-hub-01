import urllib.request
import json
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        errors = []
        page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}") if msg.type in ["error", "warning"] else None)
        page.on("pageerror", lambda e: errors.append(f"PageError: {e}"))
        
        try:
            print("Navigating to localhost:8000...")
            page.goto("http://localhost:8000", wait_until="networkidle")
            page.wait_for_timeout(2000)
            
            # Click on Auth
            print("Opening Auth page...")
            page.evaluate("switchAuthTab('signup')")
            page.fill("#signupName", "Test User")
            page.fill("#signupEmail", "testuser_unique@example.com")
            page.fill("#signupPassword", "password123")
            
            print("Submitting Signup...")
            # We want to click the specific submit button for signup
            page.click("#form-signup button[type='submit']")
            page.wait_for_timeout(3000)
            
            # Also read the error dom element just in case
            signup_err = page.locator("#signupError").text_content()
            if signup_err:
                errors.append(f"Signup DOM Error: {signup_err}")
            
            # Now let's test notes fetch
            page.goto("http://localhost:8000", wait_until="networkidle")
            page.wait_for_timeout(1000)
            page.evaluate("openSubject('physics')")
            page.wait_for_timeout(2000)
            
            print("Finished.")
            
        except Exception as e:
            print("Exception:", str(e))
        finally:
            browser.close()

        print("--- ERRORS START ---")
        for err in errors:
            print(err)
        print("--- ERRORS END ---")

if __name__ == "__main__":
    run()
