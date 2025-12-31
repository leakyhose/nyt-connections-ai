from app import create_app
from mangum import Mangum

app = create_app()
handler = Mangum(app)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
