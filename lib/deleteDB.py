from appwrite.client import Client
from appwrite.services.databases import Databases
from tqdm import tqdm

client = Client()
client.set_endpoint('https://cloud.appwrite.io/v1')
client.set_project('6647142100245a3db6ee')
client.set_key('5df33e952ca635496edec1904285f7942c533cfa4bc54888941c45d5fe33dd3eb31af4200f2a16e76368893cf3a29b838e67589a8bb6cc62da6ac860a214818810e905e885eecf075b205cc385640f4c23a1590e5bf283aa251db9a39cd695948379955d56d922dd64f360256207f1caed8ee135c7422b02e3fe8177758dd96d')

databases = Databases(client)

# List documents
documents = databases.list_documents('66472a6400116ea3fc2d', '66618efc0010b1da1e22')['documents']

print(documents)

# Delete documents
for document in tqdm(documents):
    databases.delete_document('66472a6400116ea3fc2d', '66618efc0010b1da1e22', document['$id'])

print('Documents deleted successfully')
