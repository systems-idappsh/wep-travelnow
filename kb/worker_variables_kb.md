# Travel Now - Variables recomendadas para Cloudflare Worker

Archivo informativo para el proyecto. No es necesario que el chatbot lo cargue como KB principal.

## Variables actuales recomendadas
- OPENAI_API_KEY: Secret. Llave API de OpenAI.
- ALLOWED_ORIGIN: Plaintext. https://travel-now.com.mx
- TRAVEL_NOW_WHATSAPP: Plaintext. https://wa.me/5215521114448
- MODEL: Plaintext. gpt-5-nano
- MAX_KB_CHARS: Plaintext. 9000
- KB_URL: Plaintext. https://travel-now.com.mx/kb/travelnow_kb.md
- ENDPOINT: Plaintext. https://travelnow-chatbot-ia.systems-idappsh.workers.dev/chat
- WORKER_URL: Plaintext. https://travelnow-chatbot-ia.systems-idappsh.workers.dev/

## Variables opcionales futuras por contexto
- KB_SITE_URL: https://travel-now.com.mx/kb/site_kb.md
- KB_SERVICIOS_URL: https://travel-now.com.mx/kb/servicios_kb.md
- KB_VISA_AMERICANA_URL: https://travel-now.com.mx/kb/visa-americana_kb.md
- KB_PASAPORTE_URL: https://travel-now.com.mx/kb/pasaporte_kb.md
- KB_CITAS_URL: https://travel-now.com.mx/kb/agendado-citas_kb.md
- KB_ASESORIA_URL: https://travel-now.com.mx/kb/asesoria_kb.md
- KB_VISAS_PAIS_URL: https://travel-now.com.mx/kb/visaspais_kb.md
- KB_FAQ_URL: https://travel-now.com.mx/kb/faq_kb.md
- KB_CONTACTO_URL: https://travel-now.com.mx/kb/contacto_kb.md
