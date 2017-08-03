os = `uname -a`
os_string = os.chomp
os_array = os_string.split(' ')
p os_array

case os_array[0]
when "Linux"
   path="/root/"
when "Windows"
   path="C:"
else
	path = "unknown"
end
system({"MYPATH" => "#{path}"}, "echo $MYPATH")
