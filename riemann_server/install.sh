#!/bin/sh

ansible-galaxy install -r install_roles.yml -p provisioning/roles/ --force
