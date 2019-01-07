from bs4 import BeautifulSoup
import requests
page = requests.get('https://www.myfreecams.com/#Homepage')
soup = BeautifulSoup(page.text, 'html.parser')
models = soup.find_all('div', attrs={'class': 'slm_u'})
for model in models:
    print(model.get_text())
