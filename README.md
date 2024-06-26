# Aplikacja wielowarstwowa
## Założenia  i  funkcje
##### Aplikacja ma za zadanie ułatwienie pracy recepcjonistom pracującym w małych salonach branży beauty ze szczególnym uwzględnieniem branży kosmetologicznej.
Jej funkcje obejmować będą:
- dodawanie klientów do bazy,
- edycję danych klientów,
- usuwanie klientów z bazy,
- wprowadzanie zabiegów na listę,
- edycję danych zabiegów,
- usuwanie zapisanych zabiegów,
- rejestrację wizyty klientów w salonie,
- usuwanie umówionej wizyty.
##  Uruchomienie  aplikacji  
Hostingiem  aplikacji  zajmuje  się  Github  Pages  i  jest  dostępna  pod  adresem:  
https://aolejarz-57990.github.io 
Aby  uruchomić  aplikację  należy  wykonać  następujące  kroki:  
1.  Otworzyć  przeglądarkę  internetową.  
2.  W  pasku  adresu  przeglądarki  należy  wpisać:  
https://aolejarz-57990.github.io 
3.  Nacisnąć  enter.  
4.  Aplikacja  powinna  załadować  się  w  przeglądarce.  
5.  Kliknąć  przycisk  “ustawienia”.  
6.  Wpisać  hasło  do  bazy  danych.

## Zespół 
Zespoł składa się z dwóch osób:
- Magdalena Goszkowska album nr 58207
- Aleksandra Olejarz album nr 57990

## Wybór  technologii  
##### Aplikacja  będzie  korzystała  z:  
-  baza  danych  -  internetowa  baza  danych  typu  NoSQL,  wykorzystująca  
komunikację  REST  API  (https://restdb.io).  
W  realizacji  aplikacji  zostaną  wykorzystane:  
-  HTML  -  do  strukturyzacji  treści  aplikacji.  
-  CSS  -  do  określenia  wyglądu  elementów  aplikacji.
-  JavaScript  -  do  obsługi  zdarzeń,  zapewnienia  dynamiki  oraz  interaktywności  
aplikacji.  
-  Git  -  kontrola  wersji.  
-  GitHub  Pages  -  hosting  strony

## Testowanie aplikacji 
#####  Testy  frontend  
Wykorzystano  testy  end-to-end  przy  pomocy  Selenium.  Test  skupia  się  na  
weryfikacji  poprawności  działania  kluczowych  funkcjonalności  aplikacji  z  
perspektywy  użytkownika  końcowego.  
Narzędzia:  
-  Selenium  -  narzędzie  do  automatyzacji  przeglądarek  internetowych,  
-  ChromeDriver  -  sterownik  przeglądarki  Chrome  dla  Selenium,  
-  node.js  -  środowisko  uruchomienia  testów,  
-  assert  -  moduł  node.js  do  sprawdzenia  poprawności  (tworzenia  
asercji)
##### Testy  backend  
Wykorzystano  testy  jednostkowe  skupiające  się  na  weryfikacji  poprawności  
działania  funkcji  odpowiedzialnych  za  zarządzanie  klientami  w  module  
“zarządzanie_danymi.js”.  
Narzędzia:  
-  jest  -  narzędzie  do  testowania,  
-  node.js  -  środowisko  uruchomienia  testów
