FROM python:3.13-bookworm

WORKDIR /app

RUN pip install --upgrade pip

COPY ./requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN sed -i 's/\r$//' migrations.sh

RUN chmod +x migrations.sh

ENTRYPOINT ["./migrations.sh"]

CMD ["python", "main.py"]