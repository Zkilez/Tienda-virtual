import re
import json
import logging
import random
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connection
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Precargar datos de smartphones
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM smartphones")
        columns = [col[0] for col in cursor.description]
        smartphones_data = [dict(zip(columns, row)) for row in cursor.fetchall()]
        logger.info(f"Base de datos cargada con {len(smartphones_data)} celulares")
        
        # Crear índice por modelo para búsquedas más rápidas
        phone_index = {phone['model'].lower(): phone for phone in smartphones_data}
except Exception as e:
    logger.error(f"Error al cargar smartphones: {str(e)}")
    smartphones_data = []
    phone_index = {}

# Listas de respuestas naturales
GREETINGS = [
    "¡Hola! 👋 Soy tu asistente de tecnología. ¿En qué puedo ayudarte hoy?",
    "¡Hola! 😊 Estoy aquí para ayudarte a encontrar el smartphone perfecto. ¿Qué necesitas saber?",
    "¡Buen día! 📱 Cuéntame, ¿qué tipo de celular estás buscando?"
]

HELP_RESPONSES = [
    "Claro que sí, puedo ayudarte con:",
    "Por supuesto, aquí tienes algunas opciones:",
    "Con gusto, estas son las cosas en las que te puedo ayudar:"
]

FAREWELLS = [
    "¡Ha sido un placer ayudarte! Si necesitas algo más, aquí estaré. 😊",
    "Espero haberte ayudado. ¡Vuelve cuando quieras! 👋",
    "¡Hasta luego! Que disfrutes tu nuevo smartphone cuando lo elijas. 📱"
]

PRICE_COMMENTS = {
    'low': [" (¡Una ganga! 💰)", " (Precio imbatible)", " (Muy accesible)"],
    'mid': [" (Buena relación calidad-precio)", " (Precio justo por lo que ofrece)"],
    'high': [" (Inversión premium 💎)", " (Para quienes buscan lo mejor)"]
}

COMPARISON_PROMPTS = [
    "¿Qué modelos te gustaría comparar? Puedes decirme dos o más nombres.",
    "Dime los celulares que quieres comparar, por ejemplo: 'iPhone 13 vs Samsung Galaxy S21'",
    "Para comparar, necesito que me digas al menos dos modelos, como: 'Compara el Pixel 6 con el iPhone 12'"
]

COMPARISON_STARTS = [
    "¡Perfecto! Aquí tienes la comparación:",
    "Vamos a comparar estos modelos:",
    "Analizando las diferencias entre estos smartphones:"
]

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def chat(request):
    """
    Endpoint del chatbot con manejo explícito de CORS y gestión robusta de errores
    """
    # Manejo de peticiones OPTIONS (preflight CORS)
    if request.method == "OPTIONS":
        response = JsonResponse({}, status=200)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    # Configurar respuesta CORS por defecto
    def build_response(data, status=200):
        response = JsonResponse(data, status=status)
        response["Access-Control-Allow-Origin"] = "*"
        return response

    # Manejo de peticiones POST
    try:
        # Validación del cuerpo de la solicitud
        try:
            data = json.loads(request.body)
            user_message = data.get("message", "").strip()
            session_id = data.get("session_id", "default")
            
            if not user_message:
                logger.warning(f"Solicitud vacía recibida - Session: {session_id}")
                return build_response({
                    "error": "Por favor, cuéntame qué celular o características estás buscando",
                    "options": ["Ver opciones", "Ayuda"]
                }, status=400)

        except json.JSONDecodeError as e:
            logger.error(f"Error de JSON - Session: {session_id} - Error: {str(e)}")
            return build_response({
                "error": "Formato de solicitud inválido",
                "options": ["Reintentar", "Ayuda"]
            }, status=400)

        try:
            # Verificar si el usuario está en modo comparación
            comparison_mode = cache.get(f"comparison_mode_{session_id}", False)
            
            # Procesamiento especial si está en modo comparación
            if comparison_mode:
                logger.info(f"Modo comparación activo - Session: {session_id}")
                # Limpiar el modo comparación para futuras interacciones
                cache.delete(f"comparison_mode_{session_id}")
                cache.delete(f"comparison_phones_{session_id}")
                
                # Procesar la comparación
                response_text = handle_comparison_request(user_message, session_id)
                options = ["Comparar otros", "Ver características", "Ayuda"]
            else:
                # Verificar si el mensaje ya contiene modelos para comparar
                phones_to_compare = extract_phones_from_query(user_message)
                
                if len(phones_to_compare) >= 2 and is_comparison_query(user_message):
                    logger.info(f"Comparación directa detectada - Session: {session_id}")
                    response_text = handle_comparison_request(user_message, session_id)
                    options = ["Comparar otros", "Ver características", "Ayuda"]
                elif is_comparison_query(user_message):
                    logger.info(f"Solicitud de comparación - Session: {session_id}")
                    response_text = random.choice(COMPARISON_PROMPTS)
                    # Activar modo comparación para la siguiente interacción
                    cache.set(f"comparison_mode_{session_id}", True, timeout=60*5)
                    options = ["Cancelar comparación"]
                else:
                    # Procesamiento normal para otras consultas
                    response_text = process_any_query(user_message)
                    options = get_contextual_options(user_message)
            
            logger.info(f"Respuesta exitosa - Session: {session_id}")
            return build_response({
                "response": response_text,
                "options": options,
                "source": "database"
            })

        except KeyError as e:
            logger.error(f"Falta campo en datos - Session: {session_id} - Error: {str(e)}")
            return build_response({
                "error": f"Falta información requerida: {str(e)}",
                "options": ["Reintentar", "Ayuda"]
            }, status=400)

        except ValueError as e:
            logger.error(f"Error de valor - Session: {session_id} - Error: {str(e)}")
            return build_response({
                "error": f"Datos inválidos: {str(e)}",
                "options": ["Reintentar", "Ayuda"]
            }, status=400)

        except Exception as e:
            logger.error(f"Error al procesar mensaje - Session: {session_id} - Error: {str(e)}", exc_info=True)
            return build_response({
                "error": f"Error al procesar tu solicitud: {str(e)}",
                "options": ["Reintentar", "Ayuda"]
            }, status=500)

    except Exception as e:
        logger.critical(f"Error crítico en endpoint - Error: {str(e)}", exc_info=True)
        return build_response({
            "error": "Error interno del servidor. Por favor intenta más tarde.",
            "options": ["Reintentar", "Contactar soporte"]
        }, status=500)


    except Exception as e:
        logger.error(f"Error en chat: {str(e)}")
        response = JsonResponse({
            "error": "Vaya, parece que hubo un problema. Por favor intenta con otra pregunta",
            "options": ["Reintentar", "Ayuda"]
        }, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

def is_comparison_query(query):
    """Determina si la consulta es una solicitud de comparación"""
    query_lower = query.lower()
    
    # Lista ampliada de términos de comparación
    comparison_terms = [
        'comparar', 'compara', 'comparemos', 'comparación',
        'vs', 'versus', 'contra', 'frente a',
        'diferencia', 'diferencias', 'comparativa',
        'cuál es mejor', 'cuál es la diferencia'
    ]
    
    return any(term in query_lower for term in comparison_terms)

def handle_comparison_request(user_message, session_id):
    """Maneja una solicitud de comparación entre smartphones"""
    try:
        # Extraer modelos a comparar del mensaje
        phones_to_compare = extract_phones_from_query(user_message)
        
        if len(phones_to_compare) < 2:
            return "Necesito al menos dos modelos para comparar. Por ejemplo: 'iPhone 13 vs Samsung Galaxy S21'"
        
        # Buscar los teléfonos en la base de datos
        found_phones = []
        not_found = []
        
        for phone_name in phones_to_compare:
            phone = find_phone_by_query(phone_name)
            if phone:
                found_phones.append(phone)
            else:
                not_found.append(phone_name)
        
        # Verificar que encontramos suficientes modelos
        if len(found_phones) < 2:
            error_msg = "No pude encontrar suficientes modelos para comparar."
            if not_found:
                error_msg += f" No encontré: {', '.join(not_found)}."
            error_msg += " Por favor intenta con otros nombres o más específicos."
            return error_msg
        
        # Limitar a 4 teléfonos para no saturar la comparación
        found_phones = found_phones[:4]
        
        # Guardar los teléfonos encontrados en caché para posible uso posterior
        cache.set(f"comparison_phones_{session_id}", found_phones, timeout=60*5)
        
        # Generar la comparación
        return generate_comparison_table(found_phones)
    
    except Exception as e:
        logger.error(f"Error en comparación: {str(e)}")
        return "Hubo un problema al generar la comparación. ¿Podrías intentarlo de nuevo con otros modelos?"

def extract_phones_from_query(query):
    """Extrae modelos de celulares de una consulta, con tolerancia a errores"""
    query_lower = query.lower()
    
    # Limpiar términos de comparación
    clean_query = re.sub(
        r'(comparar|compara|comparemos|comparación|vs|versus|contra|frente a|diferencia|diferencias|comparativa|cuál es mejor|cuál es la diferencia)',
        ',', 
        query_lower
    )
    
    # Dividir por comas y otros separadores
    potential_models = [m.strip() for m in re.split(r'[,&/]| y | con ', clean_query) if m.strip()]
    
    # Si encontramos al menos dos candidatos
    if len(potential_models) >= 2:
        # Intentar encontrar los modelos reales más parecidos
        found_models = []
        for model in potential_models:
            phone = find_phone_by_query(model)
            if phone:
                found_models.append(phone['model'].lower())
        
        return found_models[:4]  # Limitar a 4 modelos máximo
    
    # Si no, buscar modelos conocidos en la base de datos
    found_models = []
    for model in phone_index.keys():
        if similar(query_lower, model) > 0.7:  # Umbral de similitud
            found_models.append(model)
    
    # Eliminar duplicados manteniendo el orden
    seen = set()
    unique_models = [m for m in found_models if not (m in seen or seen.add(m))]
    
    return unique_models if len(unique_models) >= 2 else []

def generate_comparison_table(phones):
    """Genera una tabla de comparación entre múltiples smartphones"""
    if len(phones) < 2:
        return "Necesito al menos dos modelos para comparar."
    
    # Seleccionar características relevantes para comparar
    features = [
        ('Marca', lambda p: p.get('brand_name', 'N/A')),
        ('Modelo', lambda p: p.get('model', 'N/A')),
        ('Precio', lambda p: f"${p.get('price', 'N/A'):,}" if isinstance(p.get('price'), (int, float)) else 'N/A'),
        ('Pantalla', lambda p: f"{p.get('screen_size', 'N/A')}\""),
        ('Resolución', lambda p: f"{p.get('resolution_width', 'N/A')}x{p.get('resolution_height', 'N/A')}"),
        ('RAM', lambda p: f"{p.get('ram_capacity', 'N/A')}GB"),
        ('Almacenamiento', lambda p: f"{p.get('internal_memory', 'N/A')}GB"),
        ('Cámara principal', lambda p: f"{p.get('primary_camera_rear', 'N/A')}MP"),
        ('Cámara frontal', lambda p: f"{p.get('primary_camera_front', 'N/A')}MP"),
        ('Batería', lambda p: f"{p.get('battery_capacity', 'N/A')}mAh"),
        ('5G', lambda p: 'Sí' if p.get('5G_or_not') else 'No'),
        ('Sistema', lambda p: p.get('os_version', 'N/A'))
    ]
    
    # Encabezado de la comparación
    response = [random.choice(COMPARISON_STARTS)]
    
    # Crear tabla con formato Markdown para mejor visualización
    headers = ["**Característica**"] + [f"**{phone['brand_name']} {phone['model']}**" for phone in phones]
    response.append("| " + " | ".join(headers) + " |")
    response.append("|" + "|".join(["---"] * (len(phones) + 1)) + "|")
    
    # Filas de comparación
    for feature_name, feature_func in features:
        row = [f"**{feature_name}**"]
        for phone in phones:
            row.append(feature_func(phone))
        response.append("| " + " | ".join(row) + " |")
    
    # Añadir observaciones finales
    response.append("\n\n**🔍 Observaciones clave:**")
    
    # Comparar precios si están disponibles
    valid_prices = [p.get('price') for p in phones if isinstance(p.get('price'), (int, float))]
    if valid_prices:
        min_price = min(valid_prices)
        max_price = max(valid_prices)
        if min_price != max_price:
            cheapest = [p for p in phones if p.get('price') == min_price][0]
            response.append(f"- **Más económico:** {cheapest['brand_name']} {cheapest['model']} (${min_price:,})")
    
    # Comparar cámaras
    cameras = [p.get('primary_camera_rear', 0) for p in phones if isinstance(p.get('primary_camera_rear'), (int, float))]
    if cameras:
        best_cam = max(cameras)
        best_cam_phones = [p for p in phones if p.get('primary_camera_rear') == best_cam]
        if len(best_cam_phones) == 1:
            response.append(f"- **Mejor cámara:** {best_cam_phones[0]['brand_name']} {best_cam_phones[0]['model']} ({best_cam}MP)")
    
    # Comparar baterías
    batteries = [p.get('battery_capacity', 0) for p in phones if isinstance(p.get('battery_capacity'), (int, float))]
    if batteries:
        best_bat = max(batteries)
        best_bat_phones = [p for p in phones if p.get('battery_capacity') == best_bat]
        if len(best_bat_phones) == 1:
            response.append(f"- **Mayor batería:** {best_bat_phones[0]['brand_name']} {best_bat_phones[0]['model']} ({best_bat}mAh)")
    
    response.append("\n¿Te gustaría comparar otros modelos o más detalles de alguno?")
    
    return "\n".join(response)

def get_contextual_options(user_message):
    """Devuelve opciones contextuales basadas en la consulta del usuario"""
    user_message = user_message.lower()
    
    if any(term in user_message for term in ['hola', 'buenos días', 'inicio']):
        return ["Ver celulares", "Ofertas", "Ayuda"]
    
    if any(term in user_message for term in ['comparar', 'vs', 'versus', 'diferencia']):
        return ["Comparar por precio", "Comparar por cámara", "Comparar por batería"]
    
    if any(term in user_message for term in ['5g', '5 g']):
        return ["5G económicos", "Mejor 5G", "Comparar modelos 5G"]
    
    if any(term in user_message for term in ['cámara', 'camara', 'foto']):
        return ["Mejor cámara", "Selfies", "Comparar cámaras"]
    
    if any(term in user_message for term in ['precio', 'económi', 'barat']):
        return ["Menos de $10,000", "$10,000-$20,000", "Comparar precios"]
    
    if any(term in user_message for term in ['recomienda', 'sugiere']):
        return ["Para fotos", "Para juegos", "Comparar recomendaciones"]
    
    return ["Comparar modelos", "Ayuda", "Limpiar chat"]

def find_phone_by_query(query):
    """Busca teléfonos que coincidan con la consulta, permitiendo errores menores"""
    query_lower = query.lower().strip()
    
    # 1. Coincidencia exacta en modelos (case insensitive)
    for model, phone in phone_index.items():
        if query_lower == model.lower():
            return phone
    
    # 2. Coincidencia exacta en marca + modelo
    for phone in smartphones_data:
        full_name = f"{phone['brand_name'].lower()} {phone['model'].lower()}"
        if query_lower == full_name:
            return phone
    
    # 3. Búsqueda aproximada con tolerancia a errores
    best_match = None
    best_score = 0
    
    for phone in smartphones_data:
        # Opción 1: Buscar en marca + modelo
        full_name = f"{phone['brand_name'].lower()} {phone['model'].lower()}"
        
        # Opción 2: Buscar solo en modelo
        model_only = phone['model'].lower()
        
        # Calcular similitud para ambas opciones
        score_full = similar(query_lower, full_name)
        score_model = similar(query_lower, model_only)
        
        # Quedarnos con el mejor score
        current_score = max(score_full, score_model)
        
        if current_score > best_score and current_score > 0.6:  # Umbral de similitud
            best_score = current_score
            best_match = phone
    
    return best_match

def similar(a, b):
    """Calcula la similitud entre dos cadenas (0 a 1)"""
    from difflib import SequenceMatcher
    return SequenceMatcher(None, a, b).ratio()

def find_phones_by_brand(brand_query):
    """
    Busca todos los teléfonos de una marca específica
    Permite búsqueda flexible (ej: 'sams' encontrará 'Samsung')
    """
    brand_query_lower = brand_query.lower().strip()
    
    # Primero buscar coincidencia exacta
    exact_match = [phone for phone in smartphones_data 
                  if phone.get('brand_name', '').lower() == brand_query_lower]
    if exact_match:
        return exact_match
    
    # Si no hay coincidencia exacta, buscar parcial
    partial_match = [phone for phone in smartphones_data 
                    if brand_query_lower in phone.get('brand_name', '').lower()]
    return partial_match

def generate_brand_response(phones, brand_query):
    """Genera una respuesta con 5 modelos aleatorios de una marca"""
    if not phones:
        return f"No encontré modelos de la marca {brand_query} en nuestra base de datos."
    
    # Seleccionar 5 modelos aleatorios (o menos si no hay suficientes)
    random.shuffle(phones)
    sample_phones = phones[:5]
    
    # Obtener el nombre de la marca correctamente capitalizado
    brand_name = sample_phones[0]['brand_name'] if sample_phones else brand_query
    
    intro = random.choice([
        f"Estos son algunos modelos de {brand_name} que tenemos disponibles:",
        f"Encontramos estos modelos de {brand_name} en nuestro catálogo:",
        f"De la marca {brand_name}, te puedo mostrar estos modelos:"
    ])
    
    response = [intro]
    
    for i, phone in enumerate(sample_phones, 1):
        price_info = f" - ${phone.get('price', 'N/A'):,}" if isinstance(phone.get('price'), (int, float)) else ""
        features = []
        if 'ram_capacity' in phone:
            features.append(f"{phone['ram_capacity']}GB RAM")
        if 'internal_memory' in phone:
            features.append(f"{phone['internal_memory']}GB")
        if 'primary_camera_rear' in phone:
            features.append(f"{phone['primary_camera_rear']}MP")
        
        features_str = " | ".join(features) if features else ""
        
        response.append(
            f"\n{i}. {phone['model']}{price_info}"
            f"{' - ' + features_str if features_str else ''}"
        )
    
    response.append("\n\n¿Quieres más detalles de algún modelo en particular?")
    response.append(f"Puedes preguntar: 'Mostrar detalles del {sample_phones[0]['model']}'")
    response.append("O también: 'Comparar [modelo1] vs [modelo2]'")
    
    return "\n".join(response)

def process_any_query(query):
    """
    Procesa cualquier tipo de consulta sobre características de celulares
    con respuestas naturales y completas
    """
    query_lower = query.lower()
    
    # Detección de saludos
    if any(term in query_lower for term in ['hola', 'buenos días', 'buenas tardes']):
        return random.choice(GREETINGS)
    
    # Detección de despedidas
    if any(term in query_lower for term in ['gracias', 'adiós', 'hasta luego', 'chao']):
        return random.choice(FAREWELLS)
    
    # Detección de ayuda
    if any(term in query_lower for term in ['ayuda', 'qué puedes hacer', 'opciones']):
        return generate_help_response()
    
    # Detección de comparación (NUEVA VERSIÓN)
    if is_comparison_query(query):
        return random.choice(COMPARISON_PROMPTS)
    
    # 0. Búsqueda por marca (NUEVA SECCIÓN)
    # Primero verificamos si la consulta coincide con una marca
    brand_phones = find_phones_by_brand(query)
    if brand_phones:
        # Verificar si el usuario pidió específicamente "modelos de [marca]"
        if any(term in query_lower for term in ['modelos de', 'modelos', 'celulares de', 'teléfonos de']):
            return generate_brand_response(brand_phones, query)
        # Si no, verificar si la consulta es solo la marca (sin otras palabras)
        elif len(query.split()) == 1 or query_lower.replace(" ", "") == brand_phones[0]['brand_name'].lower().replace(" ", ""):
            return generate_brand_response(brand_phones, query)
    
    # 1 Búsqueda por modelo específico (CON TOLERANCIA A ERRORES)
    matched_phone = find_phone_by_query(query)
    if matched_phone:
        return generate_phone_details(matched_phone, query)

    # 2. Búsqueda por características especiales (se mantiene igual)
    if any(term in query_lower for term in ['económi', 'barat', 'precio']):
        if '5g' in query_lower:
            return handle_5g_affordable_query(query)
        return handle_price_query(query)
    
    if any(term in query_lower for term in ['cámara', 'camara', 'foto', 'fotografía']):
        return handle_camera_query(query)
    
    if any(term in query_lower for term in ['pantalla', 'display', 'pantall']):
        return handle_display_query(query)
    
    if any(term in query_lower for term in ['batería', 'bateria', 'duraci']):
        return handle_battery_query(query)
    
    if any(term in query_lower for term in ['5g', '5 g']):
        return handle_5g_query(query)
    
    if any(term in query_lower for term in ['ram', 'procesador', 'rendimiento', 'velocidad']):
        return handle_performance_query(query)
    
    if any(term in query_lower for term in ['recomienda', 'sugiere', 'mejor']):
        return handle_recommendation_query(query)
    
    # 3. Búsqueda genérica (se mantiene igual)
    return handle_general_query(query)

def generate_help_response():
    """Genera una respuesta de ayuda más natural y completa"""
    help_options = [
        "🔍 Búsqueda por modelo específico (ej: 'iPhone 13')",
        "💰 Teléfonos por rango de precios (ej: 'opciones económicas')",
        "📸 Dispositivos con buena cámara (ej: 'para tomar fotos')",
        "🔋 Celulares con mucha batería (ej: 'que dure todo el día')",
        "⚡ Opciones de alto rendimiento (ej: 'para juegos')",
        "🖥️ Pantallas de calidad (ej: 'con buena pantalla')",
        "📶 Tecnología 5G (ej: 'con 5G')",
        "🆚 Comparar modelos (ej: 'iPhone 13 vs Samsung S21')",
        "\nPuedes preguntarme de forma natural, como:",
        "'¿Qué celular me recomiendas para fotos?'",
        "'Quiero un smartphone económico con buena batería'",
        "'Compara el Pixel 6 con el Galaxy S22'"
    ]
    
    return f"{random.choice(HELP_RESPONSES)}\n" + "\n".join(help_options)

def generate_phone_details(phone, original_query):
    """Genera una descripción más humana y completa del teléfono"""
    # Respuestas introductorias aleatorias
    intros = [
        f"¡Claro! Aquí tienes los detalles del {phone['brand_name']} {phone['model']}:",
        f"Conozco ese modelo. El {phone['brand_name']} {phone['model']} tiene estas características:",
        f"¡Buena elección! El {phone['brand_name']} {phone['model']} es un excelente dispositivo. Te cuento más:"
    ]
    
    details = [random.choice(intros)]
    
    # Precio con comentario contextual
    if 'price' in phone:
        price_comment = ""
        if phone['price'] < 15000:
            price_comment = random.choice(PRICE_COMMENTS['low'])
        elif phone['price'] < 30000:
            price_comment = random.choice(PRICE_COMMENTS['mid'])
        else:
            price_comment = random.choice(PRICE_COMMENTS['high'])
        details.append(f"- 💵 *Precio:* ${phone['price']:,}{price_comment}")
    
    # Características con lenguaje más natural
    if '5G_or_not' in phone:
        network = "Sí, cuenta con 5G para máxima velocidad 📶" if phone['5G_or_not'] else "Tiene 4G LTE, suficiente para el día a día"
        details.append(f"- *Redes:* {network}")
    
    if all(k in phone for k in ['resolution_width', 'resolution_height']):
        details.append(f"- 🖥️ *Pantalla:* Resolución de {phone['resolution_width']}x{phone['resolution_height']} px (muy nítida)")
    
    if 'ram_capacity' in phone and 'internal_memory' in phone:
        ram_comment = " (ideal para multitarea)" if phone['ram_capacity'] >= 6 else " (suficiente para uso normal)"
        details.append(f"- ⚡ *Memoria:* {phone['ram_capacity']}GB RAM{ram_comment} + {phone['internal_memory']}GB de almacenamiento")
    
    if 'battery_capacity' in phone:
        battery_comment = ""
        if phone['battery_capacity'] > 4500:
            battery_comment = " (¡Duración excelente! 🔋)"
        elif phone['battery_capacity'] < 3000:
            battery_comment = " (Recomendable para uso moderado)"
        
        charging = f" y carga rápida de {phone['fast_charging']}W" if 'fast_charging' in phone else ""
        details.append(f"- *Batería:* {phone['battery_capacity']}mAh{charging}{battery_comment}")
    
    if all(k in phone for k in ['primary_camera_rear', 'num_rear_cameras']):
        camera_comment = ""
        if phone['primary_camera_rear'] >= 48:
            camera_comment = " (¡Fotos profesionales! 📸)"
        details.append(f"- *Cámara trasera:* {phone['primary_camera_rear']}MP con {phone['num_rear_cameras']} lentes{camera_comment}")
    
    # Recomendación personalizada basada en características
    recommendation = ""
    if phone.get('avg_rating', 0) >= 4.5:
        recommendation = "\n🌟 *Opinión de clientes:* ¡Muy bien valorado por los usuarios! Un acierto seguro."
    elif phone.get('price', 0) < 20000 and phone.get('ram_capacity', 0) >= 4:
        recommendation = "\n💡 *Mi opinión:* Excelente opción si buscas buen rendimiento sin gastar mucho."
    elif 'gaming' in original_query.lower() and phone.get('ram_capacity', 0) >= 6:
        recommendation = "\n🎮 *Para gaming:* Este modelo manejará bien los juegos más demandantes."
    
    if recommendation:
        details.append(recommendation)
    
    # Pregunta de seguimiento
    follow_ups = [
        "\n¿Te gustaría compararlo con otro modelo?",
        "\n¿Quieres que te sugiera accesorios para este dispositivo?",
        "\n¿Necesitas más información sobre alguna característica en particular?"
    ]
    details.append(random.choice(follow_ups))
    
    return "\n".join(details)

def handle_5g_affordable_query(query):
    """Respuesta mejorada para 5G económico"""
    try:
        affordable_5g = sorted(
            [p for p in smartphones_data if p.get('5G_or_not') and p.get('price')],
            key=lambda x: x['price']
        )[:5]
        
        if not affordable_5g:
            return "Por el momento no tenemos modelos 5G en el rango económico, pero puedo mostrarte algunas opciones 4G LTE con buena relación calidad-precio."
        
        intro = random.choice([
            "Entiendo que buscas lo mejor de ambos mundos: tecnología 5G sin gastar mucho. Estas son las opciones más accesibles:",
            "¡Buena idea! Tener 5G ya no tiene que ser caro. Mira estas alternativas económicas:",
            "Aquí tienes smartphones con 5G que no romperán tu presupuesto:"
        ])
        
        response = [intro]
        for i, phone in enumerate(affordable_5g, 1):
            price_comment = ""
            if phone['price'] < 18000:
                price_comment = random.choice(PRICE_COMMENTS['low'])
            
            response.append(
                f"\n{i}. *{phone['brand_name']} {phone['model']}*"
                f"\n   - Precio: ${phone['price']:,}{price_comment}"
                f"\n   - Pantalla: {phone.get('screen_size', 'N/A')}\""
                f"\n   - Batería: {phone.get('battery_capacity', 'N/A')}mAh"
                f"\n   - RAM: {phone.get('ram_capacity', 'N/A')}GB"
            )
        
        advice = "\n\n💡 Consejo: Los modelos con 5G suelen consumir más batería. Si priorizas duración, considera también la capacidad de la batería."
        response.append(advice)
        
        response.append("\n¿Quieres más detalles de alguno en particular?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en consulta de 5G económico: {str(e)}")
        return "Vaya, hubo un problema al buscar esas opciones. ¿Te importaría intentarlo de nuevo más tarde?"

def handle_camera_query(query):
    """Respuesta mejorada para cámaras"""
    try:
        # Priorizar cámaras con múltiples lentes y alta resolución
        best_cameras = sorted(
            [p for p in smartphones_data if p.get('primary_camera_rear')],
            key=lambda x: (x.get('num_rear_cameras', 1), x['primary_camera_rear']),
            reverse=True
        )[:5]
        
        if not best_cameras:
            return "Actualmente no tengo los datos de cámara disponibles. ¿Te interesa que te recomiende por otra característica?"
        
        # Contextualizar según la consulta
        if 'selfie' in query.lower() or 'frontal' in query.lower():
            intro = "Si lo que buscas es buena cámara frontal para selfies, estos modelos destacan:"
            key_camera = 'primary_camera_front'
        else:
            intro = random.choice([
                "Para fotografía profesional, estos smartphones tienen excelentes cámaras traseras:",
                "Si la cámara es tu prioridad, no te decepcionarán estos modelos:",
                "Aquí tienes los celulares que mejor capturan tus momentos especiales:"
            ])
            key_camera = 'primary_camera_rear'
        
        response = [intro]
        
        for i, phone in enumerate(best_cameras, 1):
            camera_specs = []
            
            # Especificaciones traseras
            if 'num_rear_cameras' in phone:
                camera_specs.append(f"{phone['num_rear_cameras']} lentes traseros")
                if phone['num_rear_cameras'] >= 3:
                    camera_specs[-1] += " (incluyendo ultra wide y telephoto)"
            
            if 'primary_camera_rear' in phone:
                camera_specs.append(f"{phone['primary_camera_rear']}MP principal")
            
            # Especificaciones frontales si es relevante
            if ('selfie' in query.lower() or 'frontal' in query.lower()) and 'primary_camera_front' in phone:
                camera_specs.append(f"{phone['primary_camera_front']}MP frontal")
            
            # Estabilización óptica
            if phone.get('optical_image_stabilization'):
                camera_specs.append("con estabilización óptica")
            
            response.append(
                f"\n{i}. *{phone['brand_name']} {phone['model']}*"
                f"\n   - {' + '.join(camera_specs)}"
                f"\n   - Precio: ${phone.get('price', 'N/A'):,}"
            )
        
        # Consejo adicional
        advice = "\n\n📸 Tip profesional: Más megapíxeles no siempre significan mejor calidad. El tamaño del sensor y el software de procesamiento son igual de importantes."
        response.append(advice)
        
        response.append("\n¿Te gustaría comparar las cámaras de dos modelos?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en consulta de cámara: {str(e)}")
        return "Hubo un problema al buscar esa información. ¿Quieres intentar con otra característica?"

def handle_recommendation_query(query):
    """Nueva función para manejar solicitudes de recomendación"""
    try:
        # Analizar la consulta para determinar prioridades
        priorities = {
            'camera': any(term in query.lower() for term in ['cámara', 'camara', 'foto', 'fotografía']),
            'battery': any(term in query.lower() for term in ['batería', 'bateria', 'duraci']),
            'performance': any(term in query.lower() for term in ['velocidad', 'rápido', 'juegos', 'rendimiento']),
            'price': any(term in query.lower() for term in ['económi', 'barat', 'precio']),
            'display': any(term in query.lower() for term in ['pantalla', 'display', 'pantall'])
        }
        
        # Determinar el tipo de recomendación
        if sum(priorities.values()) == 0:  # Si no se especificó nada
            return ("Cuéntame más sobre lo que buscas. Por ejemplo: "
                   "'Recomiéndame un celular para fotos', "
                   "'Quiero un smartphone económico con buena batería', "
                   "o 'Necesito un teléfono potente para juegos'")
        
        # Filtrar y ordenar según prioridades
        candidates = smartphones_data.copy()
        
        if priorities['price']:
            candidates = [p for p in candidates if p.get('price')]
            candidates.sort(key=lambda x: x['price'])
        
        if priorities['camera']:
            candidates.sort(key=lambda x: x.get('primary_camera_rear', 0), reverse=True)
        
        if priorities['battery']:
            candidates.sort(key=lambda x: x.get('battery_capacity', 0), reverse=True)
        
        if priorities['performance']:
            candidates.sort(key=lambda x: (x.get('ram_capacity', 0), x.get('processor_speed', 0)), reverse=True)
        
        if priorities['display']:
            candidates.sort(key=lambda x: x.get('screen_size', 0), reverse=True)
        
        # Tomar los 3 mejores candidatos
        top_recommendations = candidates[:3]
        
        if not top_recommendations:
            return "No encontré opciones que coincidan exactamente. ¿Quieres intentar con criterios más amplios?"
        
        # Construir respuesta contextual
        response = ["Basándome en lo que me comentas, te recomendaría:"]
        
        for i, phone in enumerate(top_recommendations, 1):
            highlights = []
            
            if priorities['price'] and phone['price'] < 20000:
                highlights.append("excelente precio")
            
            if priorities['camera'] and phone.get('primary_camera_rear', 0) >= 48:
                highlights.append("cámara profesional")
            
            if priorities['battery'] and phone.get('battery_capacity', 0) > 4500:
                highlights.append("batería de larga duración")
            
            if priorities['performance'] and phone.get('ram_capacity', 0) >= 6:
                highlights.append("alto rendimiento")
            
            if priorities['display'] and phone.get('screen_size', 0) >= 6.5:
                highlights.append("pantalla grande")
            
            response.append(
                f"\n{i}. *{phone['brand_name']} {phone['model']}*"
                f"\n   - Destaca por: {', '.join(highlights)}"
                f"\n   - Precio: ${phone.get('price', 'N/A'):,}"
            )
        
        response.append("\n¿Quieres más detalles de alguna de estas opciones?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en recomendación: {str(e)}")
        return "Vaya, tuve un problema al analizar tus necesidades. ¿Podrías intentar formular tu solicitud de otra forma?"

def handle_performance_query(query):
    """Maneja consultas sobre rendimiento (RAM y procesador)"""
    try:
        # Ordenar por RAM y velocidad de procesador
        performance_phones = sorted(
            [p for p in smartphones_data if p.get('ram_capacity') and p.get('processor_speed')],
            key=lambda x: (x['ram_capacity'], x['processor_speed']),
            reverse=True
        )[:5]
        
        if not performance_phones:
            return "No tenemos información de rendimiento para mostrar en este momento."
        
        intro = random.choice([
            "Si buscas potencia, estos son los modelos con mejor rendimiento:",
            "Para tareas exigentes o juegos, te recomendaría estos smartphones:",
            "Estos celulares ofrecen el máximo desempeño:"
        ])
        
        response = [intro]
        for i, phone in enumerate(performance_phones, 1):
            perf_comment = ""
            if phone['ram_capacity'] >= 8 and phone['processor_speed'] >= 2.5:
                perf_comment = " (¡Excelente para gaming! 🎮)"
            elif phone['ram_capacity'] >= 6:
                perf_comment = " (Ideal para multitarea)"
            
            response.append(
                f"\n{i}. *{phone['brand_name']} {phone['model']}*"
                f"\n   🚀 {phone['ram_capacity']}GB RAM + {phone['processor_speed']}GHz{perf_comment}"
                f"\n   💵 ${phone.get('price', 'N/A'):,}"
            )
        
        response.append("\n¿Necesitas más detalles de alguno?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en consulta de rendimiento: {str(e)}")
        return "No pude obtener la información de rendimiento."

def handle_battery_query(query):
    """Maneja consultas sobre batería"""
    try:
        battery_phones = sorted(
            [p for p in smartphones_data if p.get('battery_capacity')],
            key=lambda x: x['battery_capacity'],
            reverse=True
        )[:5]
        
        if not battery_phones:
            return "No tenemos información sobre baterías en este momento."
        
        intro = random.choice([
            "Si lo que buscas es que la batería te dure todo el día, estos modelos son ideales:",
            "Para no preocuparte por cargar tu celular constantemente, considera estas opciones:",
            "Estos smartphones tienen las baterías más grandes del mercado:"
        ])
        
        response = [intro]
        for i, phone in enumerate(battery_phones, 1):
            battery_comment = ""
            if phone['battery_capacity'] > 5000:
                battery_comment = " (¡Duración excepcional! ⚡)"
            
            charging = f"\n   🔌 Carga rápida de {phone['fast_charging']}W" if 'fast_charging' in phone else ""
            response.append(
                f"\n{i}. *{phone['brand_name']} {phone['model']}*"
                f"\n   🔋 {phone['battery_capacity']}mAh{battery_comment}{charging}"
                f"\n   💵 ${phone.get('price', 'N/A'):,}"
            )
        
        advice = "\n💡 Tip: La duración real depende de tu uso. Pantallas grandes y 5G consumen más batería."
        response.append(advice)
        
        response.append("\n¿Te interesa alguno en particular?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en consulta de batería: {str(e)}")
        return "No pude obtener la información de baterías."

def handle_display_query(query):
    """Maneja consultas sobre pantallas"""
    try:
        display_phones = sorted(
            [p for p in smartphones_data if p.get('screen_size') and p.get('refresh_rate')],
            key=lambda x: (x['screen_size'], x['refresh_rate']),
            reverse=True
        )[:5]
        
        if not display_phones:
            return "No tenemos información detallada sobre pantallas en este momento."
        
        intro = random.choice([
            "Para una experiencia visual increíble, estos smartphones tienen las mejores pantallas:",
            "Si valoras mucho la calidad de imagen, considera estos modelos:",
            "Estas son las opciones con pantallas más avanzadas:"
        ])
        
        response = [intro]
        for i, phone in enumerate(display_phones, 1):
            display_comment = ""
            if phone['refresh_rate'] >= 90:
                display_comment = " (Ultra fluida)"
            if phone['screen_size'] >= 6.7:
                display_comment += " (Pantalla grande)"
            
            response.append(
                f"\n{i}. *{phone['brand_name']} {phone['model']}*"
                f"\n   🖥️ {phone['screen_size']}\" | {phone['refresh_rate']}Hz{display_comment}"
                f"\n   💵 ${phone.get('price', 'N/A'):,}"
            )
        
        response.append("\n¿Necesitas más detalles?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en consulta de pantalla: {str(e)}")
        return "No pude obtener la información de pantallas."

def handle_5g_query(query):
    """Maneja consultas sobre 5G"""
    try:
        phones_5g = [p for p in smartphones_data if p.get('5G_or_not')][:5]
        
        if not phones_5g:
            return "Actualmente no tenemos modelos con 5G en nuestro catálogo."
        
        intro = random.choice([
            "La tecnología 5G ofrece velocidades ultrarrápidas. Estos modelos la incluyen:",
            "Para futuro-proof tu compra, estos smartphones con 5G son excelentes opciones:",
            "Estos son nuestros modelos compatibles con redes 5G:"
        ])
        
        response = [intro]
        for i, phone in enumerate(phones_5g, 1):
            response.append(
                f"\n{i}. *{phone['brand_name']} {phone['model']}*"
                f"\n   💵 ${phone.get('price', 'N/A'):,}"
                f"\n   ⚡ {phone.get('ram_capacity', 'N/A')}GB RAM"
            )
        
        advice = "\nℹ️ Recuerda que para aprovechar el 5G necesitas: 1) Un plan que lo incluya, 2) Cobertura en tu zona."
        response.append(advice)
        
        response.append("\n¿Quieres más información de alguno?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en consulta de 5G: {str(e)}")
        return "No pude obtener la información sobre 5G."

def handle_price_query(query):
    """Maneja consultas sobre precios"""
    try:
        if 'bajo' in query.lower() or 'económi' in query.lower():
            affordable = sorted(
                [p for p in smartphones_data if p.get('price')],
                key=lambda x: x['price']
            )[:5]
            
            if not affordable:
                return "No tenemos opciones económicas en este momento."
            
            intro = random.choice([
                "Estas son las opciones más accesibles sin sacrificar calidad:",
                "Si buscas ahorrar, estos smartphones ofrecen buena relación calidad-precio:",
                "Para presupuestos ajustados, considera estos modelos:"
            ])
            
            response = [intro]
            for i, phone in enumerate(affordable, 1):
                price_comment = random.choice(PRICE_COMMENTS['low']) if phone['price'] < 15000 else ""
                response.append(
                    f"\n{i}. *{phone['brand_name']} {phone['model']}*"
                    f"\n   💵 ${phone['price']:,}{price_comment}"
                    f"\n   ⚡ {phone.get('ram_capacity', 'N/A')}GB RAM"
                )
            
            advice = "\n💡 En gama baja, revisa bien: 1) Actualizaciones de software, 2) Almacenamiento expandible."
            response.append(advice)
            
            response.append("\n¿Te interesa alguno?")
            return "\n".join(response)
        
        elif 'medio' in query.lower() or 'intermedio' in query.lower():
            mid_range = sorted(
                [p for p in smartphones_data if p.get('price') and 15000 <= p['price'] <= 30000],
                key=lambda x: x['price']
            )[:5]
            
            if not mid_range:
                return "No tenemos opciones en gama media en este momento."
            
            intro = "En gama media encuentras el mejor balance entre precio y características:"
            response = [intro]
            
            for i, phone in enumerate(mid_range, 1):
                response.append(
                    f"\n{i}. *{phone['brand_name']} {phone['model']}*"
                    f"\n   💵 ${phone['price']:,}{random.choice(PRICE_COMMENTS['mid'])}"
                    f"\n   ⚡ {phone.get('ram_capacity', 'N/A')}GB RAM"
                    f"\n   📸 {phone.get('primary_camera_rear', 'N/A')}MP cámara"
                )
            
            response.append("\n¿Quieres detalles de algún modelo?")
            return "\n".join(response)
        
        else:
            return handle_general_query(query)
    
    except Exception as e:
        logger.error(f"Error en consulta de precio: {str(e)}")
        return "No pude obtener la información de precios."

def handle_general_query(query):
    """Maneja consultas genéricas con sugerencias útiles"""
    suggestions = [
        "Parece que buscas información sobre smartphones. Puedo ayudarte con:",
        "- 📸 *Recomendaciones por cámara*: '¿Cuál tiene mejor cámara para fotos?'",
        "- 🔋 *Duración de batería*: 'Quiero un celular que dure todo el día'",
        "- ⚡ *Rendimiento*: 'Necesito un teléfono rápido para juegos'",
        "- 💰 *Por presupuesto*: 'Opciones económicas', 'Gama media', 'Premium'",
        "- 🖥️ *Pantallas*: 'Qué modelo tiene mejor display'",
        "- 📶 *Tecnología*: 'Celulares con 5G'",
        "- 🆚 *Comparaciones*: 'iPhone 13 vs Samsung S21'",
        "\nPuedes preguntarme de forma natural como:",
        "'Recomiéndame un celular para mi mamá'",
        "'Quiero un smartphone con buena cámara y batería'",
        "'Compara el iPhone 12 con el Pixel 6'"
    ]
    return "\n".join(suggestions)