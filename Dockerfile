FROM ubuntu:latest
LABEL authors="pyxlu"

ENTRYPOINT ["top", "-b"]