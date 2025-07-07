from flask import Flask, jsonify, request, render_template
import json
import random
import os
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='static', template_folder='templates')

current_dir = os.path.dirname(os.path.abspath(__file__))

# Configuración para subir archivos
UPLOAD_FOLDER = os.path.join(current_dir, 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Configurar Flask para servir archivos estáticos desde uploads
app.static_folder = os.path.join(current_dir, 'static')
app.add_url_rule('/uploads/<filename>', 'uploaded_file',
                 build_only=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

with open(os.path.join(current_dir,"cartas.json"), encoding="utf-8") as f:
    cartas = json.load(f)

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and allowed_file(file.filename):
            # Generar un nombre seguro para el archivo
            filename = secure_filename(file.filename)
            # Crear un nombre único para evitar sobrescritura
            unique_filename = f"{filename.split('.')[0]}_{random.randint(1000, 9999)}.{filename.split('.')[-1]}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            
            # Generar URL relativa para la imagen
            relative_path = f'uploads/{unique_filename}'
            return jsonify({'url': relative_path})
        
        return jsonify({'error': 'Invalid file type'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/cartas", methods=["GET"])
def get_cartas():
    try:
        return jsonify(cartas)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/cartas/<int:id>", methods=["GET"])
def get_carta(id):
    try:
        carta = next((c for c in cartas if c["id"] == id), None)
        if carta:
            return jsonify(carta)
        return jsonify({"error": "Carta no encontrada"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/cartas/<int:id>", methods=["PUT"])
def update_carta(id):
    try:
        data = request.get_json()
        carta = next((c for c in cartas if c["id"] == id), None)
        if not carta:
            return jsonify({"error": "Carta no encontrada"}), 404
        
        # Actualizar solo los campos permitidos
        campos_permitidos = ['nombre', 'nombre_ingles', 'numero_romano', 'descripcion', 
                           'significado_upright', 'significado_reversed', 'elemento', 
                           'planeta', 'imagen_url']
        
        for campo in campos_permitidos:
            if campo in data:
                carta[campo] = data[campo]
        
        # Guardar los cambios en el archivo
        with open(os.path.join(current_dir,"cartas.json"), 'w', encoding='utf-8') as f:
            json.dump(cartas, f, ensure_ascii=False, indent=4)
        
        return jsonify(carta)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/cartas/<int:id>", methods=["DELETE"])
def delete_carta(id):
    try:
        global cartas
        cartas = [c for c in cartas if c["id"] != id]
        
        # Guardar los cambios en el archivo
        with open(os.path.join(current_dir,"cartas.json"), 'w', encoding='utf-8') as f:
            json.dump(cartas, f, ensure_ascii=False, indent=4)
        
        return jsonify({"message": "Carta eliminada exitosamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/cartas", methods=["POST"])
def create_carta():
    try:
        data = request.get_json()
        # Generar nuevo ID basado en el último ID existente
        new_id = max(c["id"] for c in cartas) + 1 if cartas else 0
        
        # Determinar el tipo de arcano y generar el número romano
        tipo = data.get('tipo', 'mayor')
        numero = 1
        if tipo == 'mayor':
            # Para Arcanos Mayores, usar el número romano
            numero = len([c for c in cartas if c.get('tipo', 'mayor') == 'mayor']) + 1
        else:
            # Para Arcanos Menores, usar el número arábigo
            numero = len([c for c in cartas if c.get('tipo', 'mayor') == 'menor']) + 1
        
        # Convertir número a romano para Arcanos Mayores
        def to_roman(num):
            val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
            syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
            roman_num = ''
            i = 0
            while num > 0:
                for _ in range(num // val[i]):
                    roman_num += syb[i]
                    num -= val[i]
                i += 1
            return roman_num
        
        numero_romano = to_roman(numero) if tipo == 'mayor' else str(numero)
        
        # Establecer valores por defecto si no se proporcionan
        new_carta = {
            "id": new_id,
            "nombre": data.get('nombre', ''),
            "nombre_ingles": data.get('nombre_ingles', ''),
            "numero_romano": numero_romano,
            "descripcion": data.get('descripcion', ''),
            "significado_upright": data.get('significado_upright', []),
            "significado_reversed": data.get('significado_reversed', []),
            "elemento": data.get('elemento', ''),
            "planeta": data.get('planeta', ''),
            "imagen_url": data.get('imagen_url', ''),
            "tipo": tipo
        }
        
        cartas.append(new_carta)
        
        # Guardar los cambios en el archivo
        with open(os.path.join(current_dir,"cartas.json"), 'w', encoding='utf-8') as f:
            json.dump(cartas, f, ensure_ascii=False, indent=4)
        
        return jsonify(new_carta), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
