from transformers import pipeline, BartTokenizer, BartForConditionalGeneration

for task in ['summarization', 'text2text-generation', 'text-generation']:
    try:
        p = pipeline(task, model='sshleifer/distilbart-cnn-6-6', device=-1, framework='pt')
        print(f'Task "{task}" WORKS')
        result = p('Test policy text about environmental regulations and carbon emissions.', max_length=30, min_length=5)
        print(f'  Result: {result}')
        break
    except Exception as e:
        print(f'Task "{task}" FAILED: {str(e)[:200]}')
