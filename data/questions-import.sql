INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What was the first full-length animated Disney feature film?', '["Pinocchio","Snow White and the Seven Dwarfs","Fantasia","Dumbo"]', 1, 'Snow White released in 1937 was Disney''s first animated feature.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What year did Beauty and the Beast release?', '["1989","1991","1993","1995"]', 1, 'Beauty and the Beast released in 1991 and was the first animated film nominated for Best Picture.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What type of fish is Nemo?', '["Blue Tang","Clownfish","Moorish Idol","Yellow Tang"]', 1, 'Nemo is a clownfish which live among sea anemones.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of the kingdom in Tangled?', '["Arendelle","Corona","Agrabah","Motunui"]', 1, 'Corona is where Rapunzel was born as a princess.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Frozen what is Kristoff''s reindeer''s name?', '["Sven","Olaf","Marshmallow","Duke"]', 0, 'Sven is Kristoff''s loyal reindeer companion.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the restaurant name in Ratatouille?', '["Chez Pierre","Gusteau''s","La Ratatouille","Paris Cuisine"]', 1, 'Gusteau''s is where Remy helps Linguini cook.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Moana who is the demigod that helps her?', '["Tamatoa","Te Fiti","Maui","Tui"]', 2, 'Maui is the shapeshifting demigod voiced by Dwayne Johnson.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Zootopia what is the sloth''s name at the DMV?', '["Finnick","Flash","Yax","Clawhauser"]', 1, 'Flash is the hilariously slow sloth at the DMV.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of Woody''s horse in Toy Story?', '["Bullseye","Spirit","Maximus","Angus"]', 0, 'Bullseye is Woody''s loyal horse who appears in Toy Story 2.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'Which film features the song Circle of Life?', '["Tarzan","The Lion King","The Jungle Book","Bambi"]', 1, 'Circle of Life opens The Lion King as Simba is presented.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What was the first Pixar feature film?', '["A Bug''s Life","Toy Story","Finding Nemo","Monsters Inc"]', 1, 'Toy Story released in 1995 was the first fully computer-animated feature film.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the emotion characters'' headquarters in Inside Out?', '["Mind Central","Headquarters","Brain Station","Emotion Center"]', 1, 'Headquarters is where Joy, Sadness, and other emotions work.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Up how many balloons lift Carl''s house?', '["Around 10,000","Around 20,000","Around 50,000","Around 100,000"]', 1, 'Pixar calculated it would take about 20,622 balloons.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the robot in WALL-E that he falls in love with?', '["AVA","EVE","ELLA","ADA"]', 1, 'EVE is the sleek probe robot WALL-E falls in love with.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Coco what is the name of the Land of the Dead holiday?', '["Day of the Dead","Dia de los Muertos","All Saints Day","Halloween"]', 1, 'Dia de los Muertos is the Mexican holiday celebrated in Coco.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What company does Mr. Incredible work for as a claims adjuster?', '["Insuricare","SafeCo","Metrolife","SecureAll"]', 0, 'Insuricare is where Bob Parr works his boring desk job.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Monsters Inc what powers the city?', '["Screams","Laughs","Dreams","Tears"]', 0, 'Monstropolis is powered by children''s screams until they discover laughs work better.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the Pizza Planet truck?', '["A recurring Easter egg in Pixar films","Al''s delivery truck","A character in Cars","Andy''s toy"]', 0, 'The Pizza Planet truck appears in nearly every Pixar film as an Easter egg.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is Baby Yoda''s real name?', '["Yoda Jr","Grogu","Yaddle","Minch"]', 1, 'Grogu is the real name of the Child revealed in The Mandalorian.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What planet is Luke Skywalker from?', '["Alderaan","Tatooine","Naboo","Coruscant"]', 1, 'Luke grew up on the desert planet Tatooine with his uncle and aunt.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What color is Mace Windu''s lightsaber?', '["Blue","Green","Purple","Red"]', 2, 'Mace Windu has a unique purple lightsaber requested by Samuel L. Jackson.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Who is Kylo Ren''s mother?', '["Padme Amidala","Princess Leia","Rey","Jyn Erso"]', 1, 'Kylo Ren is Ben Solo, son of Leia Organa and Han Solo.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the name of Han Solo''s ship?', '["X-Wing","TIE Fighter","Millennium Falcon","Star Destroyer"]', 2, 'The Millennium Falcon is Han''s famous light freighter.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Which planet is destroyed by the Death Star in A New Hope?', '["Naboo","Alderaan","Coruscant","Tatooine"]', 1, 'Alderaan, Princess Leia''s home planet, is destroyed by the Death Star.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the name of Thor''s hammer?', '["Stormbreaker","Mjolnir","Gungnir","Hofund"]', 1, 'Mjolnir is Thor''s enchanted hammer that only the worthy can lift.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is Tony Stark''s superhero name?', '["Steel Man","Iron Man","Metal Man","Titanium Man"]', 1, 'Tony Stark is Iron Man - genius, billionaire, playboy, philanthropist.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What planet is Gamora from?', '["Xandar","Zen-Whoberi","Titan","Knowhere"]', 1, 'Gamora is from Zen-Whoberi before Thanos adopted her.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the name of the fictional metal in Black Panther?', '["Adamantium","Vibranium","Uru","Carbonadium"]', 1, 'Vibranium is found in Wakanda and makes up Captain America''s shield.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who is the villain in the first Avengers movie?', '["Ultron","Thanos","Loki","Red Skull"]', 2, 'Loki leads the Chitauri invasion of New York in The Avengers.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What stone is in Vision''s forehead?', '["Space Stone","Mind Stone","Time Stone","Soul Stone"]', 1, 'The Mind Stone powers Vision and was originally in Loki''s scepter.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in The Little Mermaid?', '["Maleficent","Cruella","Ursula","Mother Gothel"]', 2, 'Ursula is the sea witch who tricks Ariel into trading her voice.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is the name of the villain in 101 Dalmatians?', '["Ursula","Cruella de Vil","Lady Tremaine","Queen of Hearts"]', 1, 'Cruella de Vil wants to make a fur coat from dalmatian puppies.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is Simba''s evil uncle in The Lion King?', '["Mufasa","Scar","Zazu","Rafiki"]', 1, 'Scar kills Mufasa and takes over Pride Rock.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What villain says ''Off with their heads''?', '["Cruella de Vil","Maleficent","Queen of Hearts","Evil Queen"]', 2, 'The Queen of Hearts from Alice in Wonderland loves ordering beheadings.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who cursed Aurora in Sleeping Beauty?', '["Evil Queen","Ursula","Maleficent","Mother Gothel"]', 2, 'Maleficent cursed Aurora to prick her finger on a spindle.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is Jafar''s position in Agrabah?', '["King","Sultan","Royal Vizier","Guard Captain"]', 2, 'Jafar is the Royal Vizier who wants to take over Agrabah.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in Tangled?', '["Mother Gothel","Lady Tremaine","Yzma","Ursula"]', 0, 'Mother Gothel kidnapped Rapunzel to use her magical hair.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What does Hades rule in Hercules?', '["Mount Olympus","The Ocean","The Underworld","The Sky"]', 2, 'Hades is god of the Underworld and wants to overthrow Zeus.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'How many official Disney Princesses are there?', '["10","12","14","15"]', 1, 'There are 12 official Disney Princesses in the lineup.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Who is the first Disney Princess?', '["Cinderella","Snow White","Aurora","Ariel"]', 1, 'Snow White from 1937 is the first Disney Princess.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess has the power to heal with her hair?', '["Elsa","Rapunzel","Moana","Pocahontas"]', 1, 'Rapunzel''s magical hair can heal injuries and reverse aging.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess is not royalty by birth or marriage?', '["Cinderella","Mulan","Aurora","Jasmine"]', 1, 'Mulan is a warrior, not a princess, but is honorary.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is Ariel''s father''s name?', '["Poseidon","Neptune","Triton","Aquaman"]', 2, 'King Triton is Ariel''s father and ruler of Atlantica.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess talks to animals and has forest friends?', '["Snow White","Aurora","Cinderella","All of the above"]', 3, 'Snow White, Aurora, and Cinderella all communicate with animals.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Who is the youngest Disney Princess?', '["Snow White","Jasmine","Ariel","Moana"]', 0, 'Snow White is canonically 14 years old, the youngest princess.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess cuts her hair in her movie?', '["Mulan","Rapunzel","Pocahontas","Both A and B"]', 3, 'Both Mulan and Rapunzel cut their hair in their films.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who composed the music for The Lion King?', '["Alan Menken","Hans Zimmer","Randy Newman","Danny Elfman"]', 1, 'Hans Zimmer composed the score with songs by Elton John and Tim Rice.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Which movie features the song ''A Whole New World''?', '["The Little Mermaid","Beauty and the Beast","Aladdin","Mulan"]', 2, '''A Whole New World'' is from Aladdin, sung on the magic carpet ride.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who wrote the songs for Frozen?', '["Kristen Anderson-Lopez and Robert Lopez","Alan Menken","Lin-Manuel Miranda","Randy Newman"]', 0, 'The Lopez duo wrote ''Let It Go'' and all Frozen songs.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What Disney movie features the song ''Under the Sea''?', '["Moana","Finding Nemo","The Little Mermaid","Lilo and Stitch"]', 2, '''Under the Sea'' is Sebastian''s song in The Little Mermaid.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who composed most Disney Renaissance films like Little Mermaid and Beauty and the Beast?', '["Hans Zimmer","Alan Menken","John Williams","Danny Elfman"]', 1, 'Alan Menken composed 8 Disney films including the Renaissance era.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Which movie features the song ''How Far I''ll Go''?', '["Moana","Frozen","Tangled","Brave"]', 0, '''How Far I''ll Go'' is Moana''s signature song written by Lin-Manuel Miranda.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What song does Elsa sing when building her ice palace?', '["Do You Want to Build a Snowman","Let It Go","For the First Time in Forever","Into the Unknown"]', 1, '''Let It Go'' plays as Elsa builds her ice palace and embraces her powers.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who wrote the songs for Encanto?', '["Lin-Manuel Miranda","Alan Menken","Robert Lopez","Kristen Anderson-Lopez"]', 0, 'Lin-Manuel Miranda wrote all songs including ''We Don''t Talk About Bruno''.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What year did Disneyland open?', '["1950","1955","1960","1965"]', 1, 'Disneyland opened July 17, 1955 in Anaheim, California.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the name of the castle at Magic Kingdom?', '["Sleeping Beauty Castle","Cinderella Castle","Beast Castle","Snow White Castle"]', 1, 'Cinderella Castle is the 189-foot icon of Magic Kingdom.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the Star Wars land called?', '["Star Wars Land","Galaxy''s Edge","Batuu Territory","Outer Rim"]', 1, 'Star Wars: Galaxy''s Edge is set on the planet Batuu.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'How many Disney theme park resorts exist worldwide?', '["4","5","6","7"]', 2, 'There are 6 Disney resorts in California, Florida, Tokyo, Paris, Hong Kong, and Shanghai.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is a Hidden Mickey?', '["Secret meet and greet","Mickey shaped design hidden in parks","Private dining","After hours event"]', 1, 'Hidden Mickeys are subtle Mickey shapes hidden throughout Disney parks.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the spherical structure at EPCOT called?', '["The Globe","Spaceship Earth","Future World","Geosphere"]', 1, 'Spaceship Earth is the iconic geodesic sphere at EPCOT''s entrance.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'Which Disney park is the largest by acreage?', '["Magic Kingdom","Disneyland","Animal Kingdom","Shanghai Disneyland"]', 2, 'Animal Kingdom is about 580 acres, the largest Disney park.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the mine train coaster at Magic Kingdom?', '["Thunder Mountain","Big Thunder Mountain Railroad","Mine Train Adventure","Gold Rush Mountain"]', 1, 'Big Thunder Mountain Railroad is the ''wildest ride in the wilderness''.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What famous phrase is at Disneyland entrance?', '["Where Magic Lives","Happiest Place on Earth","Where Dreams Come True","Magic is Here"]', 1, '''The Happiest Place on Earth'' is Disneyland''s famous tagline.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What year did Walt Disney World open?', '["1965","1968","1971","1975"]', 2, 'Magic Kingdom opened October 1, 1971.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What was the first Disney cruise ship?', '["Disney Wonder","Disney Magic","Disney Dream","Disney Fantasy"]', 1, 'Disney Magic launched in 1998 as the first Disney cruise ship.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is Disney''s private island called?', '["Paradise Island","Disney Island","Castaway Cay","Magic Island"]', 2, 'Castaway Cay is Disney''s private Bahamas island.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'How many ships are in the Disney Cruise fleet as of 2024?', '["4","5","6","7"]', 1, 'Disney has 5 ships: Magic, Wonder, Dream, Fantasy, and Wish.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the adults only area on Disney ships called?', '["Adult Cove","Quiet Cove","Serenity Bay","Adults Zone"]', 1, 'Quiet Cove has the adults-only pool and relaxation areas.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What unique dining concept does Disney Cruise use?', '["Fixed dining","Buffet only","Rotational dining","Room service only"]', 2, 'Rotational dining means you visit different restaurants but keep your servers.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the kids club on Disney cruise ships?', '["Mickey''s Club","Oceaneer Club","Kids Cove","Disney Kids Club"]', 1, 'Oceaneer Club is for kids ages 3-12.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is Disney''s newest ship as of 2022?', '["Disney Treasure","Disney Wish","Disney Adventure","Disney Destiny"]', 1, 'Disney Wish debuted July 2022.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the adult beach on Castaway Cay?', '["Paradise Beach","Serenity Bay","Quiet Beach","Adults Cove"]', 1, 'Serenity Bay is the adults-only beach.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What does the ship horn play when departing?', '["Traditional horn","When You Wish Upon a Star","Mickey Mouse March","Sailing Away"]', 1, 'Disney ships play ''When You Wish Upon a Star'' on departure.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is Pirate Night on Disney Cruise?', '["Themed dinner","Deck party with fireworks","Character meet and greet","All of the above"]', 3, 'Pirate Night includes dinner, deck party, costumes, and fireworks.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year was Walt Disney born?', '["1899","1901","1905","1910"]', 1, 'Walt Disney was born December 5, 1901 in Chicago.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was Walt Disney''s brother''s name?', '["Robert","Roy O. Disney","Raymond","Richard"]', 1, 'Roy O. Disney cofounded Disney with Walt in 1923.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was Mickey Mouse''s original name?', '["Mortimer Mouse","Milton Mouse","Martin Mouse","Morris Mouse"]', 0, 'Walt wanted Mortimer, but wife Lillian suggested Mickey.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year did Mickey Mouse debut?', '["1920","1925","1928","1932"]', 2, 'Mickey debuted in Steamboat Willie on November 18, 1928.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'Where is Walt Disney buried?', '["Forest Lawn Cemetery","Disneyland","Walt Disney World","He was cremated"]', 3, 'Walt Disney was cremated and his ashes are at Forest Lawn in Glendale.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was the name of Walt''s first successful cartoon character?', '["Mickey Mouse","Oswald the Lucky Rabbit","Donald Duck","Goofy"]', 1, 'Oswald was created before Mickey, but Walt lost the rights.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What was the first Disney Broadway musical?', '["Beauty and the Beast","The Lion King","The Little Mermaid","Aladdin"]', 0, 'Beauty and the Beast opened on Broadway in 1994.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What is the longest running Disney Broadway show?', '["Beauty and the Beast","The Lion King","Aladdin","Frozen"]', 1, 'The Lion King has run since 1997 and is 3rd longest running Broadway show ever.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney Broadway show features puppetry by Julie Taymor?', '["Beauty and the Beast","The Lion King","Aladdin","Mary Poppins"]', 1, 'Julie Taymor''s puppetry and masks are iconic in The Lion King.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What Disney movie became a Broadway show in 2014?', '["Frozen","Aladdin","The Little Mermaid","Newsies"]', 1, 'Aladdin opened on Broadway in March 2014.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which show features the song ''Seize the Day''?', '["Newsies","The Lion King","Aladdin","Tarzan"]', 0, '''Seize the Day'' is the Act 1 finale of Newsies.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What flavor is the famous Dole Whip?', '["Orange","Pineapple","Mango","Coconut"]', 1, 'Pineapple Dole Whip is the iconic Disney parks frozen treat.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the bestselling food item at Disney parks?', '["Turkey Legs","Churros","Dole Whip","Mickey Pretzels"]', 1, 'Churros are the top seller with millions sold annually.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the name of the restaurant inside Pirates of the Caribbean at Disneyland?', '["The Blue Lagoon","Blue Bayou","Captain Jack''s","Pirates Cove"]', 1, 'Blue Bayou is the atmospheric restaurant inside the ride.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What shape are the famous Disney ice cream bars?', '["Mickey head","Castle","Star","Circle"]', 0, 'Mickey Premium Ice Cream Bars are shaped like Mickey''s head.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the signature drink at Oga''s Cantina in Galaxy''s Edge?', '["Blue Milk","Fuzzy Tauntaun","Jedi Mind Trick","All are signature drinks"]', 3, 'Oga''s Cantina has many signature drinks including Blue Milk.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What restaurant has the 50s TV dinner theme at Hollywood Studios?', '["Sci-Fi Dine-In","50''s Prime Time Cafe","Hollywood and Vine","ABC Commissary"]', 1, '50''s Prime Time Cafe servers act as family members from the 50s.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What does ''Ohana'' mean in Lilo and Stitch?', '["Love","Friend","Family","Together"]', 2, 'Ohana means family, and family means nobody gets left behind.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Which Disney Princess is based on a real person?', '["Mulan","Pocahontas","Moana","Merida"]', 1, 'Pocahontas is based on a real Native American woman from the 1600s.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What is Buzz Lightyear''s famous catchphrase?', '["You''ve got a friend in me","To infinity and beyond","Reach for the sky","I''m a space ranger"]', 1, '''To infinity and beyond'' is Buzz''s iconic catchphrase.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Which Disney animated film has both parents alive throughout?', '["Tangled","Sleeping Beauty","101 Dalmatians","Mulan"]', 3, 'In Mulan, both parents are present and alive the whole film.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What ''A113'' refers to in Pixar films?', '["Secret code","CalArts classroom number","Hidden Mickey","Director''s birthday"]', 1, 'A113 is the CalArts classroom where many Pixar animators studied.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Who voiced both Darth Vader and Mufasa?', '["Morgan Freeman","James Earl Jones","Samuel L. Jackson","Keith David"]', 1, 'James Earl Jones'' iconic voice brought both characters to life.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What year did The Little Mermaid release?', '["1985","1987","1989","1991"]', 2, 'The Little Mermaid released in 1989 and kicked off the Disney Renaissance.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of Simba''s childhood friend in The Lion King?', '["Timon","Nala","Sarabi","Shenzi"]', 1, 'Nala is Simba''s childhood friend who later becomes his queen.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Aladdin, how many wishes does the Genie grant?', '["One","Two","Three","Unlimited"]', 2, 'The Genie grants three wishes but Aladdin uses his last wish to free the Genie.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of the fairy in Peter Pan?', '["Silvermist","Tinker Bell","Rosetta","Fawn"]', 1, 'Tinker Bell is Peter Pan''s loyal fairy companion.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'Who voices Elsa in Frozen?', '["Kristen Bell","Amy Adams","Idina Menzel","Mandy Moore"]', 2, 'Idina Menzel voices Elsa and performs the hit song Let It Go.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In The Jungle Book, what type of animal is Baloo?', '["Panther","Orangutan","Bear","Tiger"]', 2, 'Baloo is a fun-loving bear who teaches Mowgli the Bare Necessities.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of Mulan''s dragon companion?', '["Mushu","Cri-Kee","Khan","Little Brother"]', 0, 'Mushu is a small red dragon voiced by Eddie Murphy who helps Mulan.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Bambi, what type of animal is Thumper?', '["Skunk","Rabbit","Deer","Owl"]', 1, 'Thumper is Bambi''s rabbit friend named for his habit of thumping his foot.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is Pocahontas''s raccoon friend''s name?', '["Flit","Percy","Meeko","Nakoma"]', 2, 'Meeko is the mischievous raccoon who accompanies Pocahontas.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'Which Disney film features Experiment 626?', '["Big Hero 6","Lilo & Stitch","Bolt","Wreck-It Ralph"]', 1, 'Stitch''s official experiment number is 626, created by Dr. Jumba.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Encanto, what is Luisa''s magical gift?', '["Shape-shifting","Super strength","Healing","Weather control"]', 1, 'Luisa Madrigal has the gift of super strength and sings Surface Pressure.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of the kingdom in Frozen?', '["Corona","Arendelle","DunBroch","Motunui"]', 1, 'Arendelle is the Scandinavian-inspired kingdom where Elsa and Anna live.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Tarzan, who raises Tarzan as her own?', '["Kala","Kerchak","Tantor","Sabor"]', 0, 'Kala is the gorilla who adopts and raises baby Tarzan as her son.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What year did Frozen release?', '["2011","2012","2013","2014"]', 2, 'Frozen released in November 2013 and became one of Disney''s highest-grossing films.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In The Princess and the Frog, what is Tiana''s dream?', '["To be a princess","To own a restaurant","To travel the world","To be a singer"]', 1, 'Tiana dreams of opening her own restaurant in New Orleans.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the clownfish father in Finding Nemo?', '["Martin","Marlin","Marlo","Marcel"]', 1, 'Marlin is Nemo''s overprotective father who crosses the ocean to find him.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the rat protagonist in Ratatouille?', '["Emile","Remy","Alfredo","Gusteau"]', 1, 'Remy is the rat who dreams of becoming a chef in Paris.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Cars, what number is Lightning McQueen?', '["43","86","95","100"]', 2, 'Lightning McQueen''s number 95 references Toy Story''s 1995 release year.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the lead emotion in Inside Out?', '["Sadness","Anger","Joy","Fear"]', 2, 'Joy is the lead emotion who tries to keep Riley happy.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Finding Dory, what kind of fish is Dory?', '["Clownfish","Blue Tang","Angelfish","Pufferfish"]', 1, 'Dory is a blue tang with short-term memory loss.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is one of Woody''s famous pull-string phrases in Toy Story?', '["Howdy partner","You''re my favorite deputy","There''s a snake in my boot","Reach for the sky"]', 2, 'There''s a snake in my boot is one of Woody''s most recognizable pull-string phrases.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Brave, what does Merida''s mother turn into?', '["A horse","A deer","A bear","A wolf"]', 2, 'Queen Elinor is transformed into a bear by a witch''s spell.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the prospector toy villain in Toy Story 2?', '["Bullseye","Jessie","Stinky Pete","Lotso"]', 2, 'Stinky Pete the Prospector is the villain who was never sold from a store shelf.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In The Incredibles, what is Violet''s superpower?', '["Super speed","Force fields and invisibility","Super strength","Stretching"]', 1, 'Violet Parr can turn invisible and create protective force fields.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What Pixar film is set in the Land of the Dead?', '["Soul","Coco","Inside Out","Onward"]', 1, 'Coco follows Miguel to the colorful Land of the Dead on Dia de los Muertos.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Soul, what instrument does Joe Gardner play?', '["Guitar","Drums","Piano","Saxophone"]', 2, 'Joe Gardner is a middle school band teacher and jazz pianist.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Turning Red, what does Mei transform into?', '["A red fox","A red panda","A red bird","A red cat"]', 1, 'Meilin Lee transforms into a giant red panda whenever she gets emotional.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Luca, what are Luca and Alberto secretly?', '["Robots","Sea monsters","Aliens","Ghosts"]', 1, 'Luca and Alberto are sea monsters who take human form on land.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What club does Russell belong to in Up?', '["Boy Scouts","Wilderness Explorers","Adventure Rangers","Junior Adventurers"]', 1, 'Russell is a Wilderness Explorer working to earn his Assisting the Elderly badge.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Elemental, what are the two main elements that fall in love?', '["Fire and Water","Earth and Air","Fire and Air","Water and Earth"]', 0, 'Ember (fire) and Wade (water) fall in love despite being opposite elements.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the teddy bear villain in Toy Story 3?', '["Bullseye","Big Baby","Lotso","Stinky Pete"]', 2, 'Lots-o''-Huggin'' Bear is a strawberry-scented teddy bear who runs Sunnyside Daycare.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the old man in Up?', '["Carl Fredricksen","Charles Muntz","Russell","Dug"]', 0, 'Carl Fredricksen ties thousands of balloons to his house to fly to Paradise Falls.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Who is Luke Skywalker''s father?', '["Obi-Wan Kenobi","Darth Vader","Emperor Palpatine","Han Solo"]', 1, 'Darth Vader is Anakin Skywalker, Luke''s father, revealed in The Empire Strikes Back.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the name of Han Solo''s Wookiee co-pilot?', '["Wicket","Chewbacca","Tarfful","Lowbacca"]', 1, 'Chewbacca is Han Solo''s loyal Wookiee co-pilot and best friend.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the weapon of choice for a Jedi?', '["Blaster","Lightsaber","Bowcaster","Vibroblade"]', 1, 'The lightsaber is described as an elegant weapon for a more civilized age.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Who trained Luke Skywalker on Dagobah?', '["Obi-Wan Kenobi","Mace Windu","Yoda","Qui-Gon Jinn"]', 2, 'Yoda trained Luke in the ways of the Force on the swamp planet Dagobah.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the name of Boba Fett''s father?', '["Jango Fett","Cad Bane","Pre Vizsla","Din Djarin"]', 0, 'Jango Fett is Boba''s father and the template for the Republic''s clone army.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'In what year did the original Star Wars film release?', '["1975","1977","1979","1980"]', 1, 'Star Wars (A New Hope) premiered on May 25, 1977.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Which planet is the home of the Ewoks?', '["Kashyyyk","Endor","Hoth","Dagobah"]', 1, 'The forest moon of Endor is home to the Ewoks who help defeat the Empire.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Who is the Sith villain in The Phantom Menace?', '["Count Dooku","Darth Vader","Darth Maul","General Grievous"]', 2, 'Darth Maul is the Sith apprentice with a distinctive double-bladed lightsaber.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What planet is the Jedi Temple located on?', '["Naboo","Coruscant","Kamino","Mustafar"]', 1, 'The Jedi Temple is on Coruscant, the capital of the Galactic Republic.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the name of Boba Fett''s ship?', '["Razor Crest","Slave I","Outrider","Ghost"]', 1, 'Slave I is Boba Fett''s ship that tracks Han Solo to Cloud City.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Who says the famous line ''I am your father''?', '["Emperor Palpatine","Obi-Wan Kenobi","Darth Vader","Yoda"]', 2, 'Darth Vader reveals he is Luke''s father in The Empire Strikes Back.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What type of trooper wears white armor in the Empire?', '["Clone Trooper","Death Trooper","Stormtrooper","Scout Trooper"]', 2, 'Stormtroopers are the iconic white-armored soldiers of the Galactic Empire.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is unique about Kylo Ren''s lightsaber?', '["It''s double-bladed","It has a curved hilt","It has a crossguard","It''s dual-wielded"]', 2, 'Kylo Ren wields a unique crossguard lightsaber with unstable side vents.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the Mandalorian''s real name?', '["Boba Fett","Cobb Vanth","Din Djarin","Pre Vizsla"]', 2, 'Din Djarin is the Mandalorian bounty hunter who adopts Grogu.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is Order 66?', '["A trade agreement","A command to destroy the Jedi","A droid protocol","A rebel code"]', 1, 'Order 66 was Palpatine''s command for clone troopers to execute the Jedi.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the ice planet in The Empire Strikes Back?', '["Hoth","Starkiller Base","Crait","Ilum"]', 0, 'Hoth is the frozen planet where the Rebel Alliance established Echo Base.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Who is Rey''s grandfather?', '["Luke Skywalker","Han Solo","Emperor Palpatine","Obi-Wan Kenobi"]', 2, 'Rey is revealed to be the granddaughter of Emperor Palpatine in The Rise of Skywalker.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is Luke''s call sign during the Death Star attack?', '["Gold Leader","Red Five","Blue Leader","Rogue One"]', 1, 'Luke''s call sign was Red Five during the Battle of Yavin.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the name of Han Solo''s son?', '["Luke Solo","Anakin Solo","Ben Solo","Jacen Solo"]', 2, 'Ben Solo is the son of Han and Leia who becomes Kylo Ren.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is Captain America''s shield made of?', '["Adamantium","Vibranium","Uru","Titanium"]', 1, 'Captain America''s shield is made of vibranium from Wakanda.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the name of Tony Stark''s AI assistant?', '["Alexa","JARVIS","FRIDAY","Siri"]', 1, 'JARVIS (Just A Rather Very Intelligent System) is Tony''s AI who later becomes Vision.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who snaps the Infinity Gauntlet to defeat Thanos in Endgame?', '["Thor","Captain America","Tony Stark","Hulk"]', 2, 'Tony Stark sacrifices himself by snapping the Infinity Stones to defeat Thanos.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the name of Thor''s home realm?', '["Midgard","Asgard","Jotunheim","Vanaheim"]', 1, 'Asgard is the home realm of Thor and the Asgardian gods.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who is the Winter Soldier?', '["Sam Wilson","Bucky Barnes","John Walker","Helmut Zemo"]', 1, 'Bucky Barnes is Steve Rogers'' childhood friend who was brainwashed into the Winter Soldier.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What country is Black Panther the king of?', '["Wakanda","Sokovia","Latveria","Genosha"]', 0, 'T''Challa is the king of Wakanda, a technologically advanced African nation.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'How many Infinity Stones are there?', '["4","5","6","7"]', 2, 'There are six Infinity Stones: Space, Mind, Reality, Power, Time, and Soul.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is Hawkeye''s real name?', '["Clint Barton","Scott Lang","Sam Wilson","Bucky Barnes"]', 0, 'Clint Barton is Hawkeye, the expert archer and founding Avenger.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the name of the raccoon in Guardians of the Galaxy?', '["Rocky","Rocket","Ranger","Rascal"]', 1, 'Rocket is the genetically enhanced raccoon and weapons expert.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What does Groot always say?', '["I am Groot","We are Groot","Groot is here","Help me"]', 0, 'Groot can only say ''I am Groot'' but each time it means something different.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who created Ultron in the MCU?', '["Thanos","Tony Stark and Bruce Banner","Hank Pym","Wanda Maximoff"]', 1, 'Tony Stark and Bruce Banner created Ultron as a peacekeeping AI that went rogue.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What artifact does Doctor Strange wear that contains the Time Stone?', '["Cloak of Levitation","Sling Ring","Eye of Agamotto","Book of Vishanti"]', 2, 'The Eye of Agamotto is the pendant that houses the Time Stone.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is Ant-Man''s real name in the MCU?', '["Hank Pym","Scott Lang","Hope Van Dyne","Luis"]', 1, 'Scott Lang is the MCU''s Ant-Man, a former thief turned superhero.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who is the main villain in Black Panther?', '["Ulysses Klaue","Helmut Zemo","Erik Killmonger","M''Baku"]', 2, 'Erik Killmonger challenges T''Challa for the throne of Wakanda.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What color is the Power Stone?', '["Blue","Red","Purple","Green"]', 2, 'The Power Stone is purple and was first seen in Guardians of the Galaxy.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who wields the Stormbreaker axe?', '["Captain America","Thor","Odin","Heimdall"]', 1, 'Thor forges Stormbreaker in Nidavellir to fight Thanos in Infinity War.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who is Peter Parker''s aunt?', '["Aunt May","Aunt June","Aunt Beth","Aunt Rose"]', 0, 'Aunt May raises Peter Parker and is played by Marisa Tomei in the MCU.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the Quantum Realm?', '["Another galaxy","A subatomic dimension","A virtual reality","An alien planet"]', 1, 'The Quantum Realm is a subatomic dimension accessible by shrinking beyond atomic scale.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who is the God of Thunder in the MCU?', '["Loki","Odin","Thor","Heimdall"]', 2, 'Thor Odinson is the Asgardian God of Thunder and a founding Avenger.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is Captain Hook afraid of?', '["Peter Pan","A crocodile","The sea","Flying"]', 1, 'Captain Hook fears the crocodile that swallowed his hand and a ticking clock.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in The Emperor''s New Groove?', '["Maleficent","Yzma","Jafar","Gaston"]', 1, 'Yzma is the conniving advisor who wants to overthrow Emperor Kuzco.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What does Gaston want in Beauty and the Beast?', '["Gold","The Beast''s castle","To marry Belle","To be king"]', 2, 'Gaston is obsessed with marrying Belle because she is the most beautiful girl in town.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who are Ursula''s eel sidekicks in The Little Mermaid?', '["Flotsam and Jetsam","Pain and Panic","Lock and Shock","Iago and Diablo"]', 0, 'Flotsam and Jetsam are Ursula''s sneaky electric eel minions.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What does Maleficent turn into at the end of Sleeping Beauty?', '["A snake","A witch","A dragon","A raven"]', 2, 'Maleficent transforms into a fire-breathing dragon to fight Prince Phillip.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in Pocahontas?', '["Captain Hook","John Smith","Governor Ratcliffe","Claude Frollo"]', 2, 'Governor Ratcliffe leads the English settlers and greedily seeks gold in the New World.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is the name of Jafar''s parrot?', '["Iago","Diablo","Zazu","Scuttle"]', 0, 'Iago is Jafar''s loud and scheming parrot sidekick voiced by Gilbert Gottfried.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in The Hunchback of Notre Dame?', '["Gaston","Claude Frollo","Ratcliffe","Dr. Facilier"]', 1, 'Judge Claude Frollo is the cruel minister who raises Quasimodo in the bell tower.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What magic does Dr. Facilier use in The Princess and the Frog?', '["A magic lamp","Voodoo magic","Sorcery","Alchemy"]', 1, 'Dr. Facilier, the Shadow Man, uses voodoo and makes deals with dark spirits.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is the Evil Queen''s famous line in Snow White?', '["Off with their heads","Mirror mirror on the wall","I''ll get you my pretty","Long live the queen"]', 1, 'The Evil Queen asks her magic mirror who is the fairest of them all.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What animal is Prince John in Disney''s Robin Hood?', '["Fox","Bear","Lion","Snake"]', 2, 'Prince John is a cowardly lion who rules England in King Richard''s absence.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What does Te Ka turn out to be in Moana?', '["Te Fiti","Tamatoa","Maui''s shadow","A volcano goddess"]', 0, 'Te Ka is actually the goddess Te Fiti, corrupted after her heart was stolen.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is Shere Khan in The Jungle Book?', '["A bear","A panther","A tiger","A snake"]', 2, 'Shere Khan is the fearsome Bengal tiger who wants to kill Mowgli.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is Cruella de Vil''s obsession in 101 Dalmatians?', '["Jewelry","Power","Dalmatian fur","Money"]', 2, 'Cruella is obsessed with making a fur coat from dalmatian puppy spots.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in Big Hero 6?', '["Professor Callaghan","Alistair Krei","Baymax","Tadashi"]', 0, 'Professor Callaghan is revealed to be the masked villain Yokai seeking revenge.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in Wreck-It Ralph?', '["Fix-It Felix","King Candy","Sergeant Calhoun","Vanellope"]', 1, 'King Candy is actually Turbo in disguise, a game-jumping villain.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What are Pain and Panic in Hercules?', '["Hades'' imp minions","Titans","Heroes","Gods"]', 0, 'Pain and Panic are Hades'' bumbling imp sidekicks in Hercules.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What does Rapunzel use as a weapon in Tangled?', '["A sword","A frying pan","A bow","Her hair"]', 1, 'Rapunzel''s trusty frying pan becomes her signature weapon throughout Tangled.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Where is Moana from?', '["Hawaii","Motunui","Fiji","Tahiti"]', 1, 'Moana is from the fictional Polynesian island of Motunui.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is Tiana''s best friend''s name in The Princess and the Frog?', '["Charlotte","Evangeline","Mama Odie","Eudora"]', 0, 'Charlotte La Bouff is Tiana''s wealthy and princess-obsessed best friend.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What does Cinderella lose at the ball?', '["Her tiara","Her necklace","Her glass slipper","Her ring"]', 2, 'Cinderella loses her glass slipper on the palace steps as she flees at midnight.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which Disney Princess is Scottish?', '["Rapunzel","Aurora","Merida","Moana"]', 2, 'Merida is the Scottish princess from Brave who is skilled with a bow and arrow.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What animal does Jasmine have as a pet?', '["A monkey","A parrot","A tiger","A horse"]', 2, 'Rajah is Princess Jasmine''s loyal pet Bengal tiger.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is Aurora''s other name in Sleeping Beauty?', '["Rose","Briar Rose","Dawn","Rose Red"]', 1, 'Aurora is raised in the forest under the name Briar Rose by three good fairies.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Who are the three fairies in Sleeping Beauty?', '["Flora, Fauna, and Merryweather","Tinker Bell, Silvermist, and Rosetta","The Fairy Godmother and sisters","Mary, Clara, and Rose"]', 0, 'Flora, Fauna, and Merryweather are the three good fairies who raise Princess Aurora.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is Rapunzel''s chameleon friend called?', '["Maximus","Pascal","Flynn","Hook Hand"]', 1, 'Pascal is Rapunzel''s loyal chameleon companion in Tangled.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess can control ice and snow?', '["Anna","Elsa","Rapunzel","Moana"]', 1, 'Elsa has the magical power to create and control ice and snow.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Who is Belle''s father in Beauty and the Beast?', '["Gaston","Maurice","Philippe","Lumiere"]', 1, 'Maurice is Belle''s eccentric inventor father who gets lost in the forest.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What does Ariel collect from the human world?', '["Jewelry","Books","Human artifacts and gadgets","Seashells"]', 2, 'Ariel has a secret grotto filled with human objects she calls gadgets and gizmos.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess disguises herself as a man to join the army?', '["Merida","Mulan","Jasmine","Moana"]', 1, 'Mulan disguises herself as Ping to take her father''s place in the Chinese army.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is the name of Pocahontas''s love interest?', '["John Rolfe","John Smith","Captain Hook","Eric"]', 1, 'Captain John Smith is the English explorer who falls in love with Pocahontas.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'In Moana, what must be returned to Te Fiti?', '["Her crown","Her heart","Her pearl","Her necklace"]', 1, 'Moana must return the heart of Te Fiti to stop the darkness spreading across the ocean.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is the name of Ariel''s seagull friend?', '["Sebastian","Flounder","Scuttle","Max"]', 2, 'Scuttle is the seagull who claims to know about human objects but gets everything wrong.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which Disney Princess does not sing a solo in her movie?', '["Aurora","Merida","Jasmine","Moana"]', 1, 'Merida from Brave is the only Disney Princess who does not have a solo song in her film.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What movie features the song ''Be Our Guest''?', '["Cinderella","Aladdin","Beauty and the Beast","The Little Mermaid"]', 2, 'Be Our Guest is sung by Lumiere and the enchanted objects in Beauty and the Beast.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who sings ''Part of Your World'' in The Little Mermaid?', '["Belle","Ariel","Cinderella","Jasmine"]', 1, 'Part of Your World is Ariel''s signature song about wanting to live on land.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What Disney song from Pinocchio became the Disney company''s theme?', '["When You Wish Upon a Star","I''ve Got No Strings","Give a Little Whistle","Hi-Diddle-Dee-Dee"]', 0, 'When You Wish Upon a Star won an Oscar and became the Walt Disney Company''s signature melody.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Which Disney film features the song ''Hakuna Matata''?', '["Aladdin","The Lion King","The Jungle Book","Tarzan"]', 1, 'Hakuna Matata means ''no worries'' and is sung by Timon and Pumbaa in The Lion King.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who sings ''We Don''t Talk About Bruno'' in Encanto?', '["Bruno","Mirabel","The whole Madrigal family","Luisa"]', 2, 'Multiple Madrigal family members each take turns singing about the taboo subject of Bruno.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What movie features the song ''You''ve Got a Friend in Me''?', '["Monsters Inc","Finding Nemo","Toy Story","Cars"]', 2, 'You''ve Got a Friend in Me by Randy Newman is the iconic Toy Story theme song.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who wrote the music for Mary Poppins?', '["Alan Menken","The Sherman Brothers","Elton John","Randy Newman"]', 1, 'Richard and Robert Sherman wrote Supercalifragilisticexpialidocious and all Mary Poppins songs.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What Disney song includes the lyric ''tale as old as time''?', '["A Whole New World","Beauty and the Beast","Can You Feel the Love Tonight","Colors of the Wind"]', 1, 'Tale as old as time is the iconic opening lyric of the Beauty and the Beast waltz.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who wrote the songs for Tarzan?', '["Elton John","Phil Collins","Alan Menken","Hans Zimmer"]', 1, 'Phil Collins wrote and performed all songs for Tarzan including You''ll Be in My Heart.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What Moana song does Dwayne Johnson perform?', '["How Far I''ll Go","Shiny","You''re Welcome","We Know the Way"]', 2, 'Dwayne Johnson voices Maui and sings You''re Welcome, written by Lin-Manuel Miranda.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Which song is from Mulan?', '["I''ll Make a Man Out of You","Be Prepared","One Jump Ahead","Friend Like Me"]', 0, 'I''ll Make a Man Out of You is the training montage song sung by Captain Li Shang.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What movie features ''Colors of the Wind''?', '["Moana","Brave","Pocahontas","Mulan"]', 2, 'Colors of the Wind is Pocahontas''s signature song about respecting nature.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who wrote ''Can You Feel the Love Tonight'' from The Lion King?', '["Hans Zimmer","Alan Menken","Elton John and Tim Rice","Phil Collins"]', 2, 'Elton John composed the music and Tim Rice wrote the lyrics for The Lion King''s songs.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What is the opening song of Aladdin?', '["A Whole New World","Friend Like Me","Prince Ali","Arabian Nights"]', 3, 'Arabian Nights is the opening number sung by a merchant introducing the story of Aladdin.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Which Frozen song became a worldwide phenomenon and won an Academy Award?', '["Do You Want to Build a Snowman","Let It Go","For the First Time in Forever","Into the Unknown"]', 1, 'Let It Go won the Academy Award for Best Original Song and became a cultural phenomenon.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Which Disney Renaissance film does NOT have music by Alan Menken?', '["The Little Mermaid","Beauty and the Beast","The Lion King","Aladdin"]', 2, 'The Lion King features music by Hans Zimmer with songs by Elton John and Tim Rice.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What is Sebastian''s full name in The Little Mermaid?', '["Sebastian Crab","Horatio Thelonious Ignacious Crustaceous Sebastian","Sebastian the Crab","Sir Sebastian"]', 1, 'Sebastian''s full name is Horatio Thelonious Ignacious Crustaceous Sebastian.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'How many happy haunts are in the Haunted Mansion?', '["666","899","999","1013"]', 2, 'The Haunted Mansion features 999 happy haunts with room for one more.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is EPCOT an acronym for?', '["Every Person Comes Out Tired","Experimental Prototype Community of Tomorrow","Entertainment Park of Creative Opportunities","Exciting Place for Children of Tomorrow"]', 1, 'EPCOT stands for Experimental Prototype Community of Tomorrow, Walt Disney''s vision.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'Which Disney park has the Matterhorn Bobsleds?', '["Magic Kingdom","Disneyland","Tokyo Disneyland","Shanghai Disneyland"]', 1, 'The Matterhorn Bobsleds at Disneyland was the world''s first tubular steel roller coaster.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the tallest mountain attraction at Walt Disney World?', '["Space Mountain","Big Thunder Mountain","Splash Mountain","Expedition Everest"]', 3, 'Expedition Everest at Animal Kingdom stands at 199 feet tall.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'Which Disneyland land features Sleeping Beauty Castle?', '["Main Street USA","Adventureland","Fantasyland","Tomorrowland"]', 2, 'Sleeping Beauty Castle is the gateway to Fantasyland at Disneyland.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What Walt Disney World park is themed around movies?', '["EPCOT","Magic Kingdom","Hollywood Studios","Animal Kingdom"]', 2, 'Disney''s Hollywood Studios is themed around movies, TV, music, and theater.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the Avatar-themed land called at Animal Kingdom?', '["Avatar Land","Pandora - The World of Avatar","Na''vi Village","Hometree"]', 1, 'Pandora - The World of Avatar opened at Animal Kingdom in 2017.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What ride lets you design and race your own car at EPCOT?', '["Space Mountain","Test Track","Rock ''n'' Roller Coaster","Radiator Springs Racers"]', 1, 'Test Track at EPCOT lets guests design a virtual car and test it on a high-speed track.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the pirate-themed ride at Disney parks called?', '["Jolly Roger''s Revenge","Pirates of the Caribbean","Blackbeard''s Bounty","Treasure Cove"]', 1, 'Pirates of the Caribbean was one of the last attractions personally supervised by Walt Disney.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'Which Walt Disney World resort has the monorail running through it?', '["Art of Animation","All-Star Movies","Contemporary Resort","Caribbean Beach"]', 2, 'The Contemporary Resort has the monorail running through its iconic A-frame building.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the indoor roller coaster in Tomorrowland?', '["Rock ''n'' Roller Coaster","Space Mountain","Flight of Passage","TRON Lightcycle"]', 1, 'Space Mountain is the classic indoor dark roller coaster in Tomorrowland.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'How many themed lands did Disneyland have on opening day in 1955?', '["3","4","5","6"]', 2, 'Disneyland opened with Main Street USA, Adventureland, Frontierland, Fantasyland, and Tomorrowland.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the name of Disney''s flagship merchandise store on Main Street?', '["Disney Trading Post","The Emporium","World of Disney","Disney Outfitters"]', 1, 'The Emporium is the large merchandise store on Main Street USA at Disney parks.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the name of the nighttime show at EPCOT''s World Showcase Lagoon?', '["IllumiNations","Luminous","Harmonious","EPCOT Forever"]', 1, 'Luminous The Symphony of Us is the current nighttime spectacular at EPCOT.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What ride replaced Splash Mountain at Magic Kingdom?', '["Tiana''s Bayou Adventure","Princess and the Frog Rapids","Down in New Orleans","Tiana''s Palace Ride"]', 0, 'Tiana''s Bayou Adventure replaced Splash Mountain, rethemed to The Princess and the Frog.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the water coaster on the Disney Dream and Fantasy called?', '["AquaDunk","AquaDuck","AquaSlide","Pelican Plunge"]', 1, 'AquaDuck is the shipboard water coaster that extends over the edge of the ship.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the teen club called on Disney cruise ships?', '["Club 17","Vibe","Edge","The Hangout"]', 1, 'Vibe is the exclusive teen hangout for ages 14-17 on Disney cruise ships.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is Disney Cruise Line''s second private destination in the Bahamas?', '["Lighthouse Point","Treasure Cay","Eleuthera Beach","Disney Island"]', 0, 'Lighthouse Point on the island of Eleuthera is Disney''s second Bahamas destination.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What celebration happens on deck as the ship departs?', '["A farewell wave","The Sailing Away party","The Captain''s toast","The bon voyage show"]', 1, 'The Sailing Away party is a fun deck celebration with characters as the ship departs port.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'How many nights is the shortest regular Disney Cruise sailing?', '["1 night","2 nights","3 nights","5 nights"]', 2, 'Three-night Bahamas cruises are the shortest regular Disney Cruise Line sailings.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the main entertainment theater called on Disney cruise ships?', '["Walt Disney Theatre","Buena Vista Theatre","Grand Hall","Enchanted Stage"]', 0, 'The Walt Disney Theatre hosts Broadway-style stage shows on Disney cruise ships.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What age group is the Edge club for on Disney ships?', '["3-7","8-10","11-14","15-17"]', 2, 'Edge is the tween hangout for ages 11-14 on Disney Cruise Line ships.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the nursery for babies on Disney ships called?', '["It''s a Small World Nursery","Neverland Nursery","Flounder''s Reef","Pixie Hollow"]', 0, 'It''s a Small World Nursery is available for infants and toddlers under age 3.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'Where does Disney Cruise Line primarily depart from in Florida?', '["Miami","Fort Lauderdale","Port Canaveral","Tampa"]', 2, 'Port Canaveral is Disney Cruise Line''s primary departure port in Florida.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is fish extender (FE) gifting on a Disney Cruise?', '["A fishing excursion","A passenger gift exchange tradition","An onboard dining event","A character meet and greet"]', 1, 'Fish extender gifting is a fan tradition where passengers exchange small gifts hung on door hooks.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What type of stateroom has a private outdoor balcony?', '["Interior","Oceanview","Verandah","Porthole"]', 2, 'Verandah staterooms feature a private balcony for enjoying ocean views.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is Disney Cruise Line''s loyalty program called?', '["Disney Rewards","Castaway Club","Silver Seas Club","Magic Miles"]', 1, 'Castaway Club rewards repeat cruisers with Silver, Gold, and Platinum membership levels.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'Which Disney ship introduced the AquaMouse water attraction?', '["Disney Dream","Disney Fantasy","Disney Wish","Disney Treasure"]', 2, 'Disney Wish introduced AquaMouse, a family water attraction with animated show scenes.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What year did the Disney Magic first set sail?', '["1995","1998","2000","2002"]', 1, 'Disney Magic launched in 1998 as the very first Disney Cruise Line ship.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the name of the Disney Cruise Line''s sixth ship?', '["Disney Adventure","Disney Destiny","Disney Treasure","Disney Lighthouse"]', 2, 'Disney Treasure is the sixth ship in the Disney Cruise Line fleet.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was Walt Disney''s first theme park?', '["Walt Disney World","Disneyland","EPCOT","Disney California Adventure"]', 1, 'Disneyland in Anaheim, California opened in 1955 as Walt''s first theme park.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year did Walt Disney pass away?', '["1960","1964","1966","1970"]', 2, 'Walt Disney passed away on December 15, 1966 from lung cancer.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was the first cartoon with fully synchronized sound throughout?', '["Plane Crazy","Steamboat Willie","The Gallopin'' Gaucho","The Barn Dance"]', 1, 'Steamboat Willie premiered in 1928 as the first cartoon with synchronized sound throughout.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What company did Walt and Roy Disney originally found?', '["Walt Disney Productions","Disney Brothers Cartoon Studio","The Walt Disney Company","Disney Animation"]', 1, 'Walt and Roy Disney founded the Disney Brothers Cartoon Studio in 1923.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What small Missouri town inspired Main Street USA?', '["St. Louis","Kansas City","Marceline","Springfield"]', 2, 'Walt spent formative childhood years in Marceline, Missouri which inspired Main Street USA.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'How many competitive Academy Awards did Walt Disney win?', '["12","22","32","42"]', 1, 'Walt Disney won 22 competitive Academy Awards, more than any other individual in history.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was Disney''s first fully live-action feature film?', '["Treasure Island","20,000 Leagues Under the Sea","Old Yeller","Mary Poppins"]', 0, 'Treasure Island released in 1950 was Disney''s first fully live-action feature film.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What did Disney produce for the US military during World War II?', '["Weapons","Training and propaganda films","Uniforms","Nothing"]', 1, 'Disney produced training and propaganda films for the US military during WWII.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What TV show did Walt Disney personally host?', '["The Mickey Mouse Show","Walt Disney''s Wonderful World of Color","The Disney Hour","Disney Story Time"]', 1, 'Walt hosted the anthology TV series which premiered in 1954 and ran for decades.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'Who was Walt Disney''s wife?', '["Mary Disney","Lillian Disney","Margaret Disney","Dorothy Disney"]', 1, 'Lillian Bounds married Walt Disney in 1925 and famously suggested the name Mickey.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was Disney''s first full-color animated short?', '["Steamboat Willie","Flowers and Trees","The Three Little Pigs","The Old Mill"]', 1, 'Flowers and Trees (1932) was the first film in three-strip Technicolor and won an Oscar.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year did The Walt Disney Company acquire Pixar?', '["2000","2004","2006","2010"]', 2, 'Disney acquired Pixar in 2006 for approximately 7.4 billion dollars.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year did Disney acquire Marvel Entertainment?', '["2006","2009","2012","2015"]', 1, 'Disney acquired Marvel Entertainment in 2009 for approximately 4 billion dollars.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year did Disney acquire Lucasfilm?', '["2010","2012","2014","2016"]', 1, 'Disney acquired Lucasfilm and the Star Wars franchise in 2012 for 4.05 billion dollars.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'Who led Disney as CEO during the Renaissance era of the 1990s?', '["Bob Iger","Michael Eisner","Frank Wells","Jeffrey Katzenberg"]', 1, 'Michael Eisner was CEO from 1984 to 2005 and oversaw the Disney Renaissance era.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year did the Disney Channel launch?', '["1978","1983","1990","1995"]', 1, 'The Disney Channel launched on April 18, 1983 as a premium cable channel.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'How many daughters did Walt Disney have?', '["0","1","2","3"]', 2, 'Walt had two daughters: Diane (biological) and Sharon (adopted).', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What US state was Walt Disney born in?', '["California","Missouri","Illinois","New York"]', 2, 'Walt Disney was born in Chicago, Illinois on December 5, 1901.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was the first Disney feature to be entirely produced using CAPS digital technology?', '["The Little Mermaid","The Rescuers Down Under","Beauty and the Beast","Aladdin"]', 1, 'The Rescuers Down Under (1990) was the first feature entirely produced using CAPS technology.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What year did The Lion King open on Broadway?', '["1994","1997","2000","2003"]', 1, 'The Lion King opened on Broadway on November 13, 1997 at the New Amsterdam Theatre.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What Disney film was adapted into a Broadway show in 2018?', '["Moana","Frozen","Tangled","Coco"]', 1, 'Frozen opened on Broadway in March 2018 at the St. James Theatre.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Who directed the Broadway production of The Lion King?', '["Rob Ashford","Julie Taymor","Thomas Schumacher","Casey Nicholaw"]', 1, 'Julie Taymor directed and designed the groundbreaking puppetry and staging.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which actor won a Tony Award for playing the Genie in Aladdin?', '["Will Smith","James Monroe Iglehart","Robin Williams","Josh Gad"]', 1, 'James Monroe Iglehart won a Tony Award for his showstopping portrayal of the Genie.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What song was written specifically for the Beauty and the Beast Broadway show?', '["Be Our Guest","Home","Beauty and the Beast","Gaston"]', 1, 'Home was written specifically for the Broadway production as Belle''s Act 1 ballad.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney Broadway show is set during the 1899 newsboys'' strike?', '["Mary Poppins","Newsies","Aladdin","Frozen"]', 1, 'Newsies is set during the 1899 newsboys'' strike against newspaper publishers in New York.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What Disney Broadway show features songs by Phil Collins?', '["Tarzan","The Lion King","Frozen","Aladdin"]', 0, 'Tarzan the musical features songs by Phil Collins from the animated film.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'How many Tony Awards did The Lion King win in 1998?', '["2","4","6","8"]', 2, 'The Lion King won 6 Tony Awards in 1998 including Best Musical and Best Direction.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What Disney show features a magic carpet that flies over the audience?', '["Peter Pan","Aladdin","The Little Mermaid","Mary Poppins"]', 1, 'Aladdin''s Broadway production features a magic carpet that soars over the audience.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney Broadway show permanently closed after the COVID-19 shutdown?', '["Aladdin","The Lion King","Frozen","Beauty and the Beast"]', 2, 'Frozen on Broadway permanently closed in 2020 after the COVID-19 shutdown.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What is Ursula''s big villain song in The Little Mermaid musical?', '["Kiss the Girl","Under the Sea","Poor Unfortunate Souls","Part of Your World"]', 2, 'Poor Unfortunate Souls is Ursula''s show-stopping villain number.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney Broadway show features the song ''Santa Fe''?', '["The Lion King","Newsies","Aladdin","Tarzan"]', 1, 'Santa Fe is Jack Kelly''s dream song about escaping to a better life out west.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What was Julie Taymor''s historic achievement at the Tony Awards?', '["Youngest winner","First woman to win Best Direction of a Musical","Most nominations","Most wins in one night"]', 1, 'Julie Taymor was the first woman to win the Tony for Best Direction of a Musical.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What type of puppets represent animals in The Lion King on Broadway?', '["Hand puppets","Marionettes","Body puppets and masks","Animatronics"]', 2, 'Julie Taymor designed innovative body puppets and masks that actors wear and manipulate.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney Broadway show features ''Supercalifragilisticexpialidocious''?', '["Beauty and the Beast","Mary Poppins","Frozen","Aladdin"]', 1, 'Mary Poppins the musical features the iconic tongue-twisting song from the 1964 film.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney Broadway show features the song ''Carrying the Banner''?', '["Mary Poppins","Newsies","The Lion King","Aladdin"]', 1, 'Carrying the Banner is the rousing opening ensemble number of Newsies.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney film had both a Broadway musical AND a live-action remake first?', '["The Lion King","Beauty and the Beast","Aladdin","The Little Mermaid"]', 1, 'Beauty and the Beast had a Broadway musical in 1994 and a live-action remake in 2017.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What Disney Broadway show features an onstage beast-to-prince transformation?', '["Beauty and the Beast","Frozen","The Lion King","Tarzan"]', 0, 'Beauty and the Beast features the dramatic transformation of the Beast back into the Prince.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'How long has The Lion King been running on Broadway (as of 2025)?', '["Over 15 years","Over 20 years","Over 25 years","Over 30 years"]', 2, 'The Lion King has been running since 1997 and is one of Broadway''s longest-running shows.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What year did Aladdin open on Broadway?', '["2011","2014","2016","2018"]', 1, 'Aladdin opened on Broadway in March 2014 and has been a hit ever since.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the sit-down restaurant inside Cinderella Castle?', '["Royal Table","Cinderella''s Royal Table","The Royal Banquet","Castle Dining"]', 1, 'Cinderella''s Royal Table is the character dining restaurant inside Cinderella Castle.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What foods come in Mickey''s head shape at Disney parks?', '["Only ice cream bars","Only waffles","Only pretzels","All of the above and more"]', 3, 'Mickey-shaped foods include ice cream bars, waffles, pretzels, beignets, and rice krispie treats.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'Where can you get the famous Grey Stuff at Walt Disney World?', '["Be Our Guest Restaurant","Cinderella''s Royal Table","Crystal Palace","Chef Mickey''s"]', 0, 'The Grey Stuff is a cookies and cream mousse at Be Our Guest, inspired by the film''s ''try the grey stuff, it''s delicious.''', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What are the giant smoked snacks famous at Disney parks?', '["Corn dogs","Turkey legs","Sausages","Ribs"]', 1, 'Giant smoked turkey legs are an iconic Disney parks snack weighing about 1.5 pounds.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the Polynesian-themed restaurant at Walt Disney World?', '["Trader Sam''s","''Ohana","Tiki Room Dining","Aloha Isle"]', 1, '''Ohana at Disney''s Polynesian Village Resort serves family-style Polynesian cuisine.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the signature snack at the Main Street Confectionery?', '["Funnel cake","Candy apples","Cotton candy","Fudge"]', 1, 'Hand-dipped candy and caramel apples are the signature treat at Disney confectionery shops.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the popular wrap at Ronto Roasters in Galaxy''s Edge?', '["Ronto Wrap","Bantha Wrap","Jedi Wrap","Tatooine Wrap"]', 0, 'The Ronto Wrap is a pita filled with roasted pork and slaw, a popular Galaxy''s Edge snack.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What EPCOT restaurant lets you eat next to a giant aquarium?', '["Coral Reef Restaurant","The Seas Restaurant","Living Seas Cafe","Aquarium Grill"]', 0, 'Coral Reef Restaurant at The Seas pavilion features dining alongside a massive aquarium.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What restaurant at EPCOT simulates dining 220 miles above Earth?', '["Space 220","Cosmic Ray''s","Starlight Cafe","Galaxy Grill"]', 0, 'Space 220 simulates dining in space with virtual windows showing views of Earth below.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'Where can you find LeFou''s Brew at Magic Kingdom?', '["Be Our Guest","Gaston''s Tavern","Maurice''s Treats","The Friar''s Nook"]', 1, 'LeFou''s Brew is a frozen apple juice drink topped with passion fruit foam at Gaston''s Tavern.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is a Kitchen Sink sundae at Disney?', '["A dessert served in a mini kitchen sink","A small ice cream cup","A fondue","A shared appetizer"]', 0, 'The Kitchen Sink is a massive sundae served in a mini kitchen sink at Beaches & Cream.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What Hollywood Studios restaurant has a drive-in movie theme?', '["50s Prime Time Cafe","Sci-Fi Dine-In Theater","Hollywood Brown Derby","Mama Melrose''s"]', 1, 'Sci-Fi Dine-In Theater seats guests in car-shaped booths watching retro B-movie clips.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What famous restaurant sits at the top of the Contemporary Resort?', '["Narcoossee''s","California Grill","Chef Mickey''s","The Wave"]', 1, 'California Grill on the 15th floor offers panoramic views of Magic Kingdom fireworks.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the Tonga Toast at the Polynesian Resort?', '["Banana-stuffed French toast","Coconut cake","Pineapple pastry","Taro bread"]', 0, 'Tonga Toast is banana-stuffed sourdough French toast rolled in cinnamon sugar.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is Blue Milk at Galaxy''s Edge made from?', '["Dairy milk","Plant-based milk blend","Blue food coloring in water","Coconut milk"]', 1, 'Blue Milk is a frozen plant-based blend with tropical flavors like dragon fruit and lime.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the popular collectible snack container at Disney parks?', '["Character cups","Popcorn buckets","Souvenir plates","Themed lunch boxes"]', 1, 'Collectible popcorn buckets shaped like characters and attractions are hugely popular souvenirs.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What unique snack is Tokyo Disneyland most famous for?', '["Churros","Many flavors of popcorn","Turkey legs","Dole Whip"]', 1, 'Tokyo Disneyland is famous for its many unique popcorn flavors sold in collectible buckets.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the School Bread from EPCOT''s Norway pavilion?', '["A custard-filled sweet roll","A cinnamon bun","A pretzel","A croissant"]', 0, 'School Bread is a sweet cardamom bun filled with vanilla custard and topped with coconut.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the Citrus Swirl flavor at Magic Kingdom?', '["Lemon","Orange","Lime","Grapefruit"]', 1, 'The Citrus Swirl is an orange soft serve treat at Sunshine Tree Terrace in Adventureland.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What live-action Disney film features a magic nanny with an umbrella?', '["Enchanted","Bedknobs and Broomsticks","Mary Poppins","Nanny McPhee"]', 2, 'Mary Poppins arrives with her magic umbrella and carpet bag in the 1964 classic.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What is Disney''s streaming service called?', '["Disney+","Disney Now","Disney Stream","Disney Go"]', 0, 'Disney+ launched on November 12, 2019 as Disney''s dedicated streaming platform.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'In what movie does a wooden puppet wish to become a real boy?', '["Toy Story","Pinocchio","The Nutcracker","Gepetto"]', 1, 'Pinocchio wishes upon a star to become a real boy in the 1940 Disney classic.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What color are Mickey Mouse''s shorts?', '["Blue","Yellow","Red","Black"]', 2, 'Mickey Mouse''s iconic outfit features red shorts with two white buttons.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Who is Mickey Mouse''s pet dog?', '["Goofy","Pluto","Max","Figaro"]', 1, 'Pluto is Mickey Mouse''s loyal pet dog who first appeared in 1930.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What is the name of Donald Duck''s girlfriend?', '["Minnie","Daisy","Clara","Donna"]', 1, 'Daisy Duck is Donald''s girlfriend who first appeared in 1940.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What type of animal is Goofy?', '["Dog","Cow","Bear","Horse"]', 0, 'Goofy is an anthropomorphic dog, despite his pet-like friend Pluto also being a dog.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What animal is Dumbo?', '["Mouse","Dog","Elephant","Bear"]', 2, 'Dumbo is a baby elephant with oversized ears that allow him to fly.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Who is Goofy''s son?', '["Max","PJ","Bobby","Goofy Jr"]', 0, 'Max Goof is Goofy''s son, featured in A Goofy Movie and the TV show Goof Troop.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What year did Disney+ launch?', '["2018","2019","2020","2021"]', 1, 'Disney+ launched on November 12, 2019 with over 10 million subscribers on day one.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Which Pixar film features the line ''Just keep swimming''?', '["Toy Story","Finding Nemo","The Incredibles","Monsters Inc"]', 1, 'Dory''s motto ''Just keep swimming'' is one of the most iconic lines from Finding Nemo.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What is the Disney Vault?', '["A theme park attraction","Disney''s practice of limiting home video releases","Secure prop storage","A VIP dining experience"]', 1, 'The Disney Vault was the practice of periodically withdrawing films from sale to create demand.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Who is Minnie Mouse''s best friend?', '["Clarabelle Cow","Daisy Duck","Pluto","Chip"]', 1, 'Daisy Duck is Minnie Mouse''s best friend in the Disney universe.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What Disney Channel show features twins living at a hotel?', '["Hannah Montana","The Suite Life of Zack & Cody","Lizzie McGuire","That''s So Raven"]', 1, 'Zack and Cody Martin live at the Tipton Hotel in this popular Disney Channel show.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What hidden detail appears in nearly every Pixar film?', '["A hidden Mickey","The Pizza Planet truck","A Pixar ball","A blue butterfly"]', 1, 'The Pizza Planet truck from Toy Story appears as an Easter egg in nearly every Pixar film.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What does ''Hakuna Matata'' mean?', '["Be our guest","No worries","Family forever","Believe in yourself"]', 1, 'Hakuna Matata is a Swahili phrase meaning ''no worries'' popularized by The Lion King.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Which Disney Renaissance film came first?', '["Beauty and the Beast","The Little Mermaid","Aladdin","The Lion King"]', 1, 'The Little Mermaid (1989) is considered the start of the Disney Renaissance.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What year did Disney acquire 21st Century Fox?', '["2017","2019","2020","2021"]', 1, 'Disney completed the acquisition of 21st Century Fox in March 2019 for 71.3 billion dollars.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What is the hidden message in the dust cloud scene in The Lion King?', '["SOS","SEX","SFX","Nothing"]', 2, 'The dust spells out SFX, a nod to the special effects team, despite popular urban legend.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of the snowman Elsa creates in Frozen?', '["Marshmallow","Olaf","Sven","Kristoff"]', 1, 'Olaf is the friendly snowman that Elsa brings to life with her powers.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Wreck-It Ralph, what game does Ralph come from?', '["Sugar Rush","Fix-It Felix Jr.","Hero''s Duty","TurboTime"]', 1, 'Ralph is the villain in the arcade game Fix-It Felix Jr.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What animal does Kuzco turn into in The Emperor''s New Groove?', '["A frog","A cat","A llama","A donkey"]', 2, 'Emperor Kuzco is turned into a llama by Yzma''s potion.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'Who is the villain in The Rescuers?', '["Cruella","Madame Medusa","Ratigan","Yzma"]', 1, 'Madame Medusa kidnaps a young orphan girl to retrieve a diamond.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Big Hero 6, what does Baymax say when he activates?', '["I am Baymax","Hello, I am Baymax, your personal healthcare companion","I am here to help","Baymax activated"]', 1, 'Baymax always introduces himself as your personal healthcare companion.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of the magical flower in Tangled?', '["Golden Flower","Sundrop Flower","Rapunzel''s Rose","Healing Bloom"]', 1, 'The Sundrop Flower has magical healing properties that Mother Gothel hoards.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the dinosaur toy in Toy Story?', '["Rex","Dino","Spike","Trixie"]', 0, 'Rex is the anxious Tyrannosaurus Rex toy who is afraid of everything.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Onward, what are the brothers trying to do?', '["Find treasure","Bring back their father for one day","Save their kingdom","Learn magic at school"]', 1, 'Ian and Barley Lightfoot go on a quest to bring back their late father for 24 hours.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the fish tank gang leader in Finding Nemo?', '["Bloat","Gill","Jacques","Deb"]', 1, 'Gill is the Moorish Idol who leads the Tank Gang escape plans.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Toy Story 4, what new toy does Bonnie make?', '["Sporky","Forky","Knifey","Spoony"]', 1, 'Forky is a spork craft project that Bonnie brings to life as a new toy.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is Sulley''s full name in Monsters, Inc.?', '["Sullivan Monster","James P. Sullivan","Samuel Sullivan","John Sullivan"]', 1, 'James P. Sullivan, known as Sulley, is the top scarer at Monsters, Inc.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What sport does Riley play in Inside Out?', '["Soccer","Hockey","Basketball","Volleyball"]', 1, 'Riley plays hockey and her love of the sport creates a core memory island.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the name of Yoda''s species?', '["Yodaling","Unknown","Dagobahn","Whills"]', 1, 'Yoda''s species has never been officially named in Star Wars canon.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the Rebel base in A New Hope?', '["Hoth","Yavin 4","Endor","Dagobah"]', 1, 'The Rebel base on Yavin 4 is where they launch the attack on the Death Star.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Who trained Obi-Wan Kenobi?', '["Yoda","Mace Windu","Qui-Gon Jinn","Count Dooku"]', 2, 'Qui-Gon Jinn was Obi-Wan''s Jedi Master who was killed by Darth Maul.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the name of Anakin Skywalker''s mother?', '["Padme","Shmi","Satine","Breha"]', 1, 'Shmi Skywalker raised Anakin alone on Tatooine as a slave.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What does AT-AT stand for?', '["All Terrain Assault Tank","All Terrain Armored Transport","Armed Transport Attack Tank","Assault Terrain Armored Tank"]', 1, 'AT-AT stands for All Terrain Armored Transport, the Empire''s iconic walking tanks.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Who built C-3PO?', '["Obi-Wan Kenobi","Watto","Anakin Skywalker","Padme Amidala"]', 2, 'Young Anakin Skywalker built C-3PO from spare parts on Tatooine.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the name of Thor''s mischievous brother?', '["Baldur","Loki","Tyr","Heimdall"]', 1, 'Loki is the God of Mischief and Thor''s adopted brother.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is Black Widow''s real name?', '["Wanda Maximoff","Natasha Romanoff","Hope Van Dyne","Maria Hill"]', 1, 'Natasha Romanoff is Black Widow, a former Russian spy and founding Avenger.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who is the main villain in Spider-Man: Homecoming?', '["Green Goblin","Mysterio","Vulture","Doc Ock"]', 2, 'Adrian Toomes, the Vulture, is the villain played by Michael Keaton.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who becomes Captain America after Steve Rogers?', '["Bucky Barnes","Sam Wilson","John Walker","Scott Lang"]', 1, 'Sam Wilson (Falcon) takes up the shield as the new Captain America.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What planet is Thanos from?', '["Xandar","Knowhere","Titan","Vormir"]', 2, 'Thanos is from the planet Titan, which was devastated by overpopulation.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the name of Wakanda''s heart-shaped plant?', '["Vibranium flower","Heart-Shaped Herb","Panther root","Wakandan lotus"]', 1, 'The Heart-Shaped Herb grants the power of the Black Panther to its consumer.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is the name of Gaston''s sidekick in Beauty and the Beast?', '["LeFou","Pierre","Maurice","Cogsworth"]', 0, 'LeFou is Gaston''s loyal but bumbling sidekick.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is Syndrome''s real name in The Incredibles?', '["Buddy Pine","Simon Lynch","Howard Duff","Edwin Pine"]', 0, 'Buddy Pine was Mr. Incredible''s rejected fan who became the villain Syndrome.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What does Ursula transform into to trick Prince Eric?', '["A mermaid","A woman named Vanessa","A sea queen","A princess"]', 1, 'Ursula transforms into a beautiful woman named Vanessa using Ariel''s stolen voice.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in Mulan?', '["Li Shang","Shan Yu","The Emperor","Chi-Fu"]', 1, 'Shan Yu is the ruthless leader of the Hun army who invades China.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What animal is Kaa in The Jungle Book?', '["A bear","A monkey","A snake","A tiger"]', 2, 'Kaa is the hypnotic python who tries to eat Mowgli.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in The Fox and the Hound?', '["Amos Slade","Cruella","Shere Khan","McLeach"]', 0, 'Amos Slade is the grumpy hunter who wants to kill Tod the fox.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is the name of Ariel''s prince?', '["Prince Charming","Prince Phillip","Prince Eric","Prince Naveen"]', 2, 'Prince Eric is the human prince that Ariel falls in love with.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is the name of Rapunzel''s kingdom in Tangled?', '["Arendelle","Corona","Enchancia","Maldonia"]', 1, 'Corona is the kingdom where Rapunzel was born as a princess.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Who is Tiana''s prince in The Princess and the Frog?', '["Prince Eric","Prince Charming","Prince Naveen","Prince Adam"]', 2, 'Prince Naveen of Maldonia is turned into a frog by Dr. Facilier''s voodoo.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is Cinderella''s stepmother''s name?', '["Lady Tremaine","Madame Medusa","Mother Gothel","Queen Grimhilde"]', 0, 'Lady Tremaine is Cinderella''s cold and cruel stepmother.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is the name of Belle''s enchanted rose?', '["The Eternal Rose","The Enchanted Rose","The Magic Rose","The Cursed Rose"]', 1, 'The Enchanted Rose wilts as the Beast''s deadline to break the curse approaches.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is the name of Snow White''s prince?', '["Prince Charming","The Prince","Prince Ferdinand","Prince Florian"]', 1, 'Snow White''s prince is officially known simply as The Prince in the original film.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What movie features ''I Just Can''t Wait to Be King''?', '["Aladdin","The Lion King","Moana","Hercules"]', 1, 'Young Simba sings I Just Can''t Wait to Be King in The Lion King.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who sings ''Surface Pressure'' in Encanto?', '["Mirabel","Isabela","Luisa","Bruno"]', 2, 'Luisa sings Surface Pressure about the weight of expectations on her shoulders.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What song does the Genie sing when first appearing in Aladdin?', '["A Whole New World","Prince Ali","Friend Like Me","One Jump Ahead"]', 2, 'Friend Like Me is the Genie''s big introductory number when freed from the lamp.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Which movie features ''The Bare Necessities''?', '["Tarzan","The Jungle Book","The Lion King","Robin Hood"]', 1, 'The Bare Necessities is sung by Baloo in The Jungle Book about enjoying a simple life.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What Frozen 2 song is Elsa''s signature power ballad?', '["Show Yourself","Into the Unknown","All Is Found","Some Things Never Change"]', 1, 'Into the Unknown is Elsa''s power ballad from Frozen 2, nominated for an Oscar.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who sings ''Be Prepared'' in The Lion King?', '["Mufasa","Simba","Scar","Zazu"]', 2, 'Scar sings Be Prepared as he plots to overthrow Mufasa and take the throne.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What ride lets you fly on a banshee at Animal Kingdom?', '["Soarin''","Flight of Passage","Star Tours","Peter Pan''s Flight"]', 1, 'Avatar Flight of Passage is a 3D flying simulator ride in Pandora.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the name of the TRON ride at Magic Kingdom?', '["TRON Speedway","TRON Lightcycle / Run","TRON Coaster","TRON Grid"]', 1, 'TRON Lightcycle / Run opened at Magic Kingdom in 2023 in Tomorrowland.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'Which EPCOT country pavilion has a Frozen ride?', '["Germany","Norway","United Kingdom","Canada"]', 1, 'Norway pavilion features Frozen Ever After, which replaced the original Maelstrom ride.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What attraction lets you soar over world landmarks?', '["Star Tours","Soarin'' Around the World","Flight of Passage","Peter Pan''s Flight"]', 1, 'Soarin'' Around the World is a hang-gliding simulator over iconic landmarks.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What dark ride takes you flying to Neverland?', '["Dumbo","It''s a Small World","Peter Pan''s Flight","Winnie the Pooh"]', 2, 'Peter Pan''s Flight takes you flying over London and into Neverland.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What roller coaster goes through Mount Everest at Animal Kingdom?', '["Mount Everest","Everest Express","Expedition Everest","Yeti Mountain"]', 2, 'Expedition Everest - Legend of the Forbidden Mountain features the terrifying Yeti.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the name of the buffet restaurant on the Disney Dream and Fantasy?', '["Cabanas","Beach Blanket Buffet","Topsiders","Marceline Market"]', 0, 'Cabanas is the casual buffet restaurant found on Disney Dream and Fantasy.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What makes Disney the only cruise line to do this at sea?', '["Character dining","Fireworks at sea","Broadway shows","Waterslides"]', 1, 'Disney Cruise Line is the only cruise line to set off fireworks at sea during Pirate Night.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What Frozen-themed restaurant is on the Disney Wish?', '["Olaf''s Cafe","Arendelle: A Frozen Dining Adventure","Ice Palace","Oaken''s Tavern"]', 1, 'Arendelle: A Frozen Dining Adventure features singing and live entertainment during dinner.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What color is the hull of Disney cruise ships?', '["White","Navy blue","Black","Red"]', 1, 'Disney cruise ships have a distinctive navy blue hull with red and yellow accents.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the premium restaurant on the Disney Dream and Fantasy?', '["Remy","Palo","Enchante","Lumiere''s"]', 0, 'Remy is the premium French-inspired dining experience named after the Ratatouille character.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What Marvel-themed restaurant is on the Disney Wish?', '["Avengers Kitchen","Worlds of Marvel","Stark''s Steakhouse","Hero''s Galley"]', 1, 'Worlds of Marvel is an interactive dining experience with Avengers-themed storytelling.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was the name of Walt Disney''s first business that failed?', '["Disney Brothers Studio","Laugh-O-Gram Studio","Hyperion Studio","Walt Disney Animation"]', 1, 'Laugh-O-Gram Studio in Kansas City went bankrupt in 1923 before Walt moved to Hollywood.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'Who is the CEO of The Walt Disney Company as of 2025?', '["Bob Chapek","Bob Iger","Michael Eisner","Tom Staggs"]', 1, 'Bob Iger returned as CEO of Disney in November 2022.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What animated short won Disney''s first Academy Award?', '["Steamboat Willie","Flowers and Trees","The Three Little Pigs","The Old Mill"]', 1, 'Flowers and Trees (1932) won the first Academy Award for Best Animated Short Film.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year did Disneyland Paris open?', '["1983","1988","1992","1998"]', 2, 'Disneyland Paris (originally Euro Disney) opened on April 12, 1992.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year did Tokyo Disneyland open?', '["1978","1983","1988","1992"]', 1, 'Tokyo Disneyland opened on April 15, 1983 as the first Disney park outside the US.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What Disney animated feature combined live-action and animation in 1944?', '["Song of the South","Mary Poppins","Saludos Amigos","The Three Caballeros"]', 3, 'The Three Caballeros (1944) was a groundbreaking blend of animation and live-action.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What song from The Little Mermaid musical is Ariel''s signature number?', '["Under the Sea","Part of Your World","Kiss the Girl","She''s in Love"]', 1, 'Part of Your World is Ariel''s iconic I Want song in both the film and musical.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney musical features the song ''King of New York''?', '["Aladdin","The Lion King","Newsies","The Little Mermaid"]', 2, 'King of New York is the celebratory Act 2 number in Newsies.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney Broadway show won the Tony for Best Musical in 1998?', '["Beauty and the Beast","The Lion King","Aladdin","Newsies"]', 1, 'The Lion King won the Tony Award for Best Musical in 1998.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What Disney musical features the song ''Step in Time''?', '["Newsies","Mary Poppins","Beauty and the Beast","The Lion King"]', 1, 'Step in Time is the chimney sweeps big dance number in Mary Poppins.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What year did Beauty and the Beast close on Broadway?', '["2001","2003","2007","2010"]', 2, 'Beauty and the Beast ran for 13 years and closed in 2007 after 5,461 performances.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What is Prince Hans'' villain reveal song in Frozen the Musical?', '["Let It Go","Monster","Hans of the Southern Isles","True Love"]', 2, 'Hans of the Southern Isles is Prince Hans'' villain reveal number in the stage show.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the signature snack at Sleepy Hollow in Magic Kingdom?', '["Turkey leg","Funnel cake","Waffle sandwich","Corn dog"]', 2, 'Sleepy Hollow is famous for its sweet and savory fresh waffle sandwiches.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What character dining restaurant is at the Contemporary Resort?', '["Chef Mickey''s","Cinderella''s Royal Table","Crystal Palace","''Ohana"]', 0, 'Chef Mickey''s is a popular character dining buffet at the Contemporary Resort.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What shape are Mickey Waffles?', '["Round","Square","Mickey''s head","Castle"]', 2, 'Mickey Waffles shaped like Mickey''s head are a beloved Disney resort breakfast staple.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the popular frozen drink at the France pavilion in EPCOT?', '["Frozen lemonade","Grand Marnier Orange Slush","Champagne float","Frozen sangria"]', 1, 'The Grand Marnier Orange Slush is a cult favorite treat at EPCOT''s France pavilion.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What Marvel-themed dining is available at Disney parks?', '["Stark''s Steakhouse","Pym Test Kitchen","Avengers Cafe","Hero''s Grill"]', 1, 'Pym Test Kitchen at Avengers Campus serves food in hilariously oversized and tiny portions.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the iconic breakfast item at Disney resort hotels?', '["Pancakes","Mickey Waffles","French Toast","Eggs Benedict"]', 1, 'Mickey-shaped waffles are the quintessential Disney resort breakfast item.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What are the names of Cinderella''s stepsisters?', '["Ella and Bella","Anastasia and Drizella","Victoria and Elizabeth","Rose and Lily"]', 1, 'Anastasia and Drizella are Cinderella''s mean stepsisters.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What is the name of the toy store in Toy Story 2?', '["Toys R Us","Al''s Toy Barn","Andy''s Toy Box","Buzz''s Toy Store"]', 1, 'Al''s Toy Barn is the toy store owned by Al McWhiggin who steals Woody.', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Which Disney film was the first to have a theatrical sequel?', '["The Lion King","Aladdin","The Rescuers","Fantasia"]', 2, 'The Rescuers Down Under (1990) was the first Disney animated theatrical sequel.', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What is the name of the villain queen in Snow White?', '["Maleficent","The Evil Queen","Ursula","Mother Gothel"]', 1, 'The Evil Queen (Queen Grimhilde) is Snow White''s vain stepmother.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What year was the first Toy Story released?', '["1993","1995","1997","1999"]', 1, 'Toy Story released in 1995 as the first fully computer-animated feature film.', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What Disney character is known for losing a glass slipper?', '["Snow White","Aurora","Cinderella","Rapunzel"]', 2, 'Cinderella famously loses her glass slipper at the stroke of midnight.', 'easy');
