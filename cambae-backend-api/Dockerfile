FROM python:3

RUN apt-get update && apt-get install -y \
  jq \
  ffmpeg
RUN pip install streamlink

COPY streamlink-plugins/myfreecams.py /root/.config/streamlink/plugins/myfreecams.py

WORKDIR /usr/src/app

COPY . .

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt
CMD ["gunicorn", "-b", ":6903", "app:create_app"]
#CMD [ "flask", "run", "-h", "0.0.0.0", "-p", "6901" ]
