import json

def generate_fixed_workflow():
    try:
        with open('c:/Users/aruns/Desktop/Trivern/n8n/trivern-workflow-v3.json', 'r') as f:
            data = json.load(f)

        PHONE_EXPR = "{{ $('Filter Text Messages').first().json.body.entry[0].changes[0].value.messages[0].from }}"

        for node in data.get('nodes', []):
            name = node.get('name')
            if name == 'check_role':
                node['parameters']['url'] = 'https://trivern.tech/api/n8n/check-role?phone=' + PHONE_EXPR
            elif name == 'get_available_slots':
                node['parameters']['url'] = 'https://trivern.tech/api/n8n/get-available-slots?phone=' + PHONE_EXPR + '&priority=auto'
            elif name == 'save_lead':
                node['parameters']['url'] = 'https://trivern.tech/api/n8n/lead-capture'
                node['parameters']['jsonBody'] = '={\n  "name": "{name}",\n  "phone": "' + PHONE_EXPR + '",\n  "company": "{company}",\n  "industry": "{industry}",\n  "service": "{service}",\n  "context": "{context_or_pain_points}",\n  "urgency": "{urgency}",\n  "businessType": "{business_type}",\n  "decisionRole": "{decision_role}"\n}'
            elif name == 'book_meeting':
                node['parameters']['url'] = 'https://trivern.tech/api/n8n/book-meeting'
                node['parameters']['jsonBody'] = '={\n  "phone": "' + PHONE_EXPR + '",\n  "slotStart": "{selected_slot_iso}",\n  "duration": 20,\n  "notes": "{meeting_notes}"\n}'
            elif name == 'save_conversation':
                node['parameters']['url'] = 'https://trivern.tech/api/n8n/save-conversation'
                node['parameters']['jsonBody'] = '={\n  "phone": "' + PHONE_EXPR + '",\n  "messages": {messages_array},\n  "summary": "{conversation_summary}"\n}'
            elif name == 'emergency_cancel':
                node['parameters']['url'] = 'https://trivern.tech/api/n8n/emergency-cancel'
                node['parameters']['jsonBody'] = '={\n  "ownerPhone": "' + PHONE_EXPR + '",\n  "scope": "{cancel_scope}",\n  "reason": "{reason}"\n}'

        data['name'] = 'Trivern Lead Engine v7 (Final Env Fix)'
        data['id'] = 'fixed-v7-trivern'

        with open('c:/Users/aruns/Desktop/Trivern/n8n/trivern-workflow-v7-fixed.json', 'w') as f:
            json.dump(data, f, indent=4)
        print('SUCCESS')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    generate_fixed_workflow()
