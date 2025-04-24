import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import connection

logger = logging.getLogger(__name__)

# Precargar datos de smartphones
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM smartphones")
        columns = [col[0] for col in cursor.description]
        smartphones_data = [dict(zip(columns, row)) for row in cursor.fetchall()]
        logger.info(f"Base de datos cargada con {len(smartphones_data)} celulares")
except Exception as e:
    logger.error(f"Error al cargar smartphones: {str(e)}")
    smartphones_data = []

@csrf_exempt
@require_POST
def chat(request):
    """
    Endpoint del chatbot con respuestas completas y naturales
    """
    try:
        data = json.loads(request.body)
        user_message = data.get("message", "").strip()
        
        if not user_message:
            return JsonResponse({"error": "Por favor, cuéntame qué celular o características estás buscando"}, status=400)

        # Procesamiento inteligente de la consulta
        response = process_any_query(user_message)
        
        return JsonResponse({
            "response": response,
            "source": "database"
        })

    except Exception as e:
        logger.error(f"Error en chat: {str(e)}")
        return JsonResponse({
            "error": "Vaya, parece que hubo un problema. Por favor intenta con otra pregunta",
            "details": str(e)
        }, status=500)

def find_phone_by_query(query):
    """Busca teléfonos que coincidan con la consulta"""
    query_lower = query.lower()
    
    # Primero buscar coincidencia exacta en modelos
    for phone in smartphones_data:
        if query_lower in phone['model'].lower() or phone['model'].lower() in query_lower:
            return phone
    
    # Luego buscar por palabras clave en modelos
    keywords = [word for word in query_lower.split() if len(word) > 3]
    for phone in smartphones_data:
        if any(keyword in phone['model'].lower() for keyword in keywords):
            return phone
    
    return None

def process_any_query(query):
    """
    Procesa cualquier tipo de consulta sobre características de celulares
    con respuestas naturales y completas
    """
    query_lower = query.lower()
    
    # 1. Búsqueda por modelo específico
    matched_phone = find_phone_by_query(query)
    if matched_phone:
        return generate_phone_details(matched_phone, query)
    
    # 2. Búsqueda por características especiales
    if any(term in query_lower for term in ['económi', 'barat', 'precio']):
        if '5g' in query_lower:
            return handle_5g_affordable_query()
        return handle_price_query(query)
    
    if any(term in query_lower for term in ['cámara', 'camara', 'foto']):
        return handle_camera_query(query)
    
    if any(term in query_lower for term in ['pantalla', 'display', 'pantall']):
        return handle_display_query(query)
    
    if any(term in query_lower for term in ['batería', 'bateria']):
        return handle_battery_query(query)
    
    if any(term in query_lower for term in ['5g', '5 g']):
        return handle_5g_query(query)
    
    if any(term in query_lower for term in ['ram', 'procesador', 'rendimiento']):
        return handle_performance_query(query)
    
    # 3. Búsqueda genérica
    return handle_general_query(query)

def generate_phone_details(phone, original_query):
    """Genera una descripción completa y natural del teléfono"""
    details = []
    
    # Encabezado con nombre y marca
    details.append(f"📱 *{phone['brand_name']} {phone['model']}*")
    
    # Precio formateado
    if 'price' in phone:
        details.append(f"💵 *Precio:* ${phone['price']:,}")
    
    # Características destacadas
    if '5G_or_not' in phone:
        details.append(f"📶 *Redes:* {'5G' if phone['5G_or_not'] else '4G LTE'}")
    
    if all(k in phone for k in ['resolution_width', 'resolution_height']):
        details.append(f"🖥️ *Pantalla:* {phone['resolution_width']}x{phone['resolution_height']} px")
    
    if 'ram_capacity' in phone and 'internal_memory' in phone:
        details.append(f"⚡ *Memoria:* {phone['ram_capacity']}GB RAM + {phone['internal_memory']}GB")
    
    if 'battery_capacity' in phone:
        charging = f" con carga de {phone['fast_charging']}W" if 'fast_charging' in phone else ""
        details.append(f"🔋 *Batería:* {phone['battery_capacity']}mAh{charging}")
    
    if all(k in phone for k in ['primary_camera_rear', 'num_rear_cameras']):
        details.append(f"📸 *Cámara:* {phone['primary_camera_rear']}MP ({phone['num_rear_cameras']} lentes)")
    
    # Recomendación adicional
    if phone.get('avg_rating', 0) >= 4.5:
        details.append("\n⭐ *Recomendado por nuestros clientes*")
    elif phone.get('price', 0) < 20000:
        details.append("\n💡 *Excelente relación calidad-precio*")
    
    return "\n".join(details)

def handle_5g_affordable_query():
    """Maneja consultas sobre opciones económicas con 5G"""
    try:
        affordable_5g = sorted(
            [p for p in smartphones_data if p.get('5G_or_not') and p.get('price')],
            key=lambda x: x['price']
        )[:5]
        
        if not affordable_5g:
            return "Actualmente no tenemos opciones económicas con 5G en nuestro catálogo."
        
        response = ["📱 *Opciones económicas con 5G:*"]
        for i, phone in enumerate(affordable_5g, 1):
            response.append(
                f"{i}. *{phone['brand_name']} {phone['model']}*\n"
                f"   💵 ${phone['price']:,}\n"
                f"   ⚡ {phone.get('ram_capacity', 'N/A')}GB RAM\n"
                f"   🔋 {phone.get('battery_capacity', 'N/A')}mAh"
            )
        
        response.append("\n¿Te interesa alguno en particular?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en consulta de 5G económico: {str(e)}")
        return "No pude obtener la información en este momento."

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
        
        response = ["⚡ *Celulares con mejor rendimiento:*"]
        for i, phone in enumerate(performance_phones, 1):
            response.append(
                f"{i}. *{phone['brand_name']} {phone['model']}*\n"
                f"   🚀 {phone['ram_capacity']}GB RAM\n"
                f"   ⏱️ {phone['processor_speed']}GHz\n"
                f"   💵 ${phone.get('price', 'N/A'):,}"
            )
        
        response.append("\n¿Necesitas más detalles de alguno?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en consulta de rendimiento: {str(e)}")
        return "No pude obtener la información de rendimiento."

def handle_camera_query(query):
    """Maneja consultas sobre cámaras"""
    try:
        best_cameras = sorted(
            [p for p in smartphones_data if p.get('primary_camera_rear')],
            key=lambda x: x['primary_camera_rear'],
            reverse=True
        )[:5]
        
        if not best_cameras:
            return "No tenemos información detallada sobre cámaras en este momento."
        
        response = ["📸 *Celulares con mejor cámara:*"]
        for i, phone in enumerate(best_cameras, 1):
            camera_info = f"{phone['primary_camera_rear']}MP"
            if 'num_rear_cameras' in phone:
                camera_info += f" ({phone['num_rear_cameras']} lentes)"
            
            response.append(
                f"{i}. *{phone['brand_name']} {phone['model']}*\n"
                f"   {camera_info}\n"
                f"   💵 ${phone.get('price', 'N/A'):,}"
            )
        
        response.append("\n¿Quieres más detalles de alguno?")
        return "\n".join(response)
    
    except Exception as e:
        logger.error(f"Error en consulta de cámara: {str(e)}")
        return "No pude obtener la información de cámaras."

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
        
        response = ["🔋 *Celulares con mejor batería:*"]
        for i, phone in enumerate(battery_phones, 1):
            charging = f" | Carga rápida {phone['fast_charging']}W" if 'fast_charging' in phone else ""
            response.append(
                f"{i}. *{phone['brand_name']} {phone['model']}*\n"
                f"   {phone['battery_capacity']}mAh{charging}\n"
                f"   💵 ${phone.get('price', 'N/A'):,}"
            )
        
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
        
        response = ["🖥️ *Celulares con mejor pantalla:*"]
        for i, phone in enumerate(display_phones, 1):
            response.append(
                f"{i}. *{phone['brand_name']} {phone['model']}*\n"
                f"   {phone['screen_size']}\" | {phone['refresh_rate']}Hz\n"
                f"   💵 ${phone.get('price', 'N/A'):,}"
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
        
        response = ["📶 *Celulares con 5G:*"]
        for i, phone in enumerate(phones_5g, 1):
            response.append(
                f"{i}. *{phone['brand_name']} {phone['model']}*\n"
                f"   💵 ${phone.get('price', 'N/A'):,}\n"
                f"   ⚡ {phone.get('ram_capacity', 'N/A')}GB RAM"
            )
        
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
            
            response = ["💵 *Celulares más económicos:*"]
            for i, phone in enumerate(affordable, 1):
                response.append(
                    f"{i}. *{phone['brand_name']} {phone['model']}*\n"
                    f"   ${phone['price']:,}\n"
                    f"   ⚡ {phone.get('ram_capacity', 'N/A')}GB RAM"
                )
            
            response.append("\n¿Te interesa alguno?")
            return "\n".join(response)
        
        else:
            return handle_general_query(query)
    
    except Exception as e:
        logger.error(f"Error en consulta de precio: {str(e)}")
        return "No pude obtener la información de precios."

def handle_general_query(query):
    """Maneja consultas genéricas con sugerencias útiles"""
    suggestions = [
        "Puedo ayudarte a encontrar celulares por:",
        "- 📸 Calidad de cámara",
        "- 🖥️ Tamaño y resolución de pantalla",
        "- 🔋 Duración de batería",
        "- ⚡ Performance (RAM/procesador)",
        "- 💵 Rango de precios",
        "- 📶 Tecnología 5G",
        "\nEjemplos:",
        "'Quiero un celular con buena cámara y batería duradera'",
        "'Mostrarme opciones económicas con 5G'",
        "'Cuál tiene mejor pantalla?'"
    ]
    return "\n".join(suggestions)