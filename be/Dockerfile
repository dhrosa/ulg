FROM python:3.12-bookworm

RUN apt-get update
RUN apt-get install --yes pipx

RUN addgroup be
RUN adduser --disabled-password --gecos '' --ingroup be  be

RUN mkdir /be

RUN chown -R be:be /be

USER be

WORKDIR /be
COPY . .

ENV PATH="/home/be/.local/bin:$PATH"
RUN pipx install hatch

RUN hatch shell