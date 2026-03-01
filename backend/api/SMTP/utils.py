from random import randint

def generate_verify_code() -> int:
    return randint(100000, 999999)

def generate_html_verify_message(code: int, username: str) -> str:
    result = f"""
<html>
  <body style="background-color: #1f1f1f; font-family: Arial, sans-serif; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 50px auto; background-color: #2a2a2a; padding: 30px; border-radius: 12px; text-align: center;">
      <h1 style="color: #04c6e9; margin-bottom: 20px;">Привет {username}, спасибо за регистрацию!</h1>
      <p style="color: #ececec; font-size: 18px; margin-bottom: 30px;">
        Вот твой код подтверждения: <b>{code}</b>
      </p>
      <a href="https://example.com" 
         style="display: inline-block; background-color: #04c6e9; color: #1f1f1f; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold;">
        Перейти на сайт, чтобы подтвердить аккаунт
      </a>
    </div>
  </body>
</html>
"""
    return result