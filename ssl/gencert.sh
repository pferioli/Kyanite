openssl genrsa -out privatekey.pem 1024
openssl req -new -key privatekey.pem -subj "/C=AR/OU=AAII/CN=*.aaii.com" -out certrequest.csr
openssl x509 -days 1825 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
mkdir -p development
mkdir -p production
mv *.csr development
mv *.pem development
