# Copyright 2016 Prabhu Vignesh Kumar Rajagopal <prabhu.vignesh1990@gmail.com>

require 'rubygems'
require 'json'
require 'highline/import'	
require 'net/ssh'
require 'optparse'
require 'net/scp'
require 'io/console'
class Basic
	def self.presentation(str)
		system("echo ''")
		system("echo ''")
		system("echo ''")
		system("echo '======================================================================'")
		system("echo ------------------#{str}-------------------")
		system("echo '======================================================================'")
		system("echo ''")
		system("echo ''")
		system("echo ''")
	end
	def self.yesno(prompt = 'Continue?', default = true)
	  a = ''
	  s = default ? '[Y/n]' : '[y/N]'
	  d = default ? 'y' : 'n'
	  until %w[y n].include? a
	    a = ask("#{prompt} #{s} ") { |q| q.limit = 1; q.case = :downcase }
	    a = d if a.length == 0
	  end
	  a == 'y'
	end

end


# =============================== general operations ++++++++++++++++++++++++

Basic.presentation("running robin machine - vagrant")
system("cd /home/vicky/vagrantsss/robin && vagrant up")

if Basic.yesno("Want to reload vagrant?", true)
	system("cd /home/vicky/vagrantsss/robin && vagrant reload")
	Basic.presentation("Running robin ansible playbook") 
	system("cd /home/vicky/Documents/ansible_playbook/robin_ansible && ansible-playbook robin_ansible.yml")
else
	Basic.presentation("Running satori ansible playbook") 
	system("cd /home/vicky/Documents/ansible_playbook/robin_ansible && ansible-playbook robin_ansible.yml")
end


