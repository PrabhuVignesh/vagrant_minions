#!/usr/bin/env bash
# Copyright 2016 Prabhu Vignesh Kumar Rajagopal <prabhu.vignesh1990@gmail.com>



set -e

GITLAB_FLAVOR="gitlab-ce"

GITLAB_HOSTNAME="gitlab"


export DEBIAN_FRONTEND=noninteractive

fatal()
{
    echo "fatal: $@" >&2
}

check_for_root()
{
    if [[ $EUID != 0 ]]; then
        fatal "need to be root"
        exit 1
    fi
}

check_for_gitlab_rb()
{
    if [[ ! -e /vagrant/gitlab.rb ]]; then
        fatal "gitlab.rb not found at /vagrant"
        exit 1
    fi
}

check_for_backwards_compatibility()
{
    if egrep -q "^ci_external_url" /vagrant/gitlab.rb; then
        fatal "ci_external_url setting detected in 'gitlab.rb'"
        fatal "This setting is deprecated in Gitlab 8.0+, and will cause Chef to fail."
        exit 1
    fi
}

set_apt_pdiff_off()
{
    echo 'Acquire::PDiffs "false";' > /etc/apt/apt.conf.d/85pdiff-off
}


check_for_root

check_for_gitlab_rb
check_for_backwards_compatibility

apt-get -y update
apt-get -y install debconf-utils wget curl

apt-get -y install openssh-server postfix

apt-get -y install ca-certificates ssl-cert
make-ssl-cert generate-default-snakeoil --force-overwrite

set_apt_pdiff_off
curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | sudo bash
apt-get install -y $GITLAB_FLAVOR

cp /vagrant/gitlab.rb /etc/gitlab/gitlab.rb
gitlab-ctl reconfigure

echo "Done!"
