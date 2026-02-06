INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What was the first full-length animated Disney feature film?', '["Pinocchio", "Snow White and the Seven Dwarfs", "Fantasia", "Dumbo"]', 1, 'Snow White released in 1937 was Disneys first animated feature', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What year did Beauty and the Beast release?', '["1989", "1991", "1993", "1995"]', 1, 'Beauty and the Beast released in 1991 and was first animated film nominated for Best Picture', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What type of fish is Nemo?', '["Blue Tang", "Clownfish", "Moorish Idol", "Yellow Tang"]', 1, 'Nemo is a clownfish which live among sea anemones', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of the kingdom in Tangled?', '["Arendelle", "Corona", "Agrabah", "Motunui"]', 1, 'Corona is where Rapunzel was born as a princess', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Frozen what is Kristoffs reindeers name?', '["Sven", "Olaf", "Marshmallow", "Duke"]', 0, 'Sven is Kristoffs loyal reindeer companion', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the restaurant name in Ratatouille?', '["Chez Pierre", "Gusteaus", "La Ratatouille", "Paris Cuisine"]', 1, 'Gusteaus is where Remy helps Linguini cook', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Moana who is the demigod that helps her?', '["Tamatoa", "Te Fiti", "Maui", "Tui"]', 2, 'Maui is the shapeshifting demigod voiced by Dwayne Johnson', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'In Zootopia what is the sloths name at the DMV?', '["Finnick", "Flash", "Yax", "Clawhauser"]', 1, 'Flash is the hilariously slow sloth at the DMV', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'What is the name of Woodys horse in Toy Story?', '["Bullseye", "Spirit", "Maximus", "Angus"]', 0, 'Bullseye is Woodys loyal horse who appears in Toy Story 2', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'animation'), 'Which film features the song Circle of Life?', '["Tarzan", "The Lion King", "The Jungle Book", "Bambi"]', 1, 'Circle of Life opens The Lion King as Simba is presented', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What was the first Pixar feature film?', '["A Bugs Life", "Toy Story", "Finding Nemo", "Monsters Inc"]', 1, 'Toy Story released in 1995 was the first fully computer-animated feature film', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the emotion characters headquarters in Inside Out?', '["Mind Central", "Headquarters", "Brain Station", "Emotion Center"]', 1, 'Headquarters is where Joy Sadness and other emotions work', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Up how many balloons lift Carls house?', '["Around 10000", "Around 20000", "Around 50000", "Around 100000"]', 1, 'Pixar calculated it would take about 20622 balloons', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the name of the robot in WALL-E that he falls in love with?', '["AVA", "EVE", "ELLA", "ADA"]', 1, 'EVE is the sleek probe robot WALL-E falls in love with', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Coco what is the name of the Land of the Dead holiday?', '["Day of the Dead", "Dia de los Muertos", "All Saints Day", "Halloween"]', 1, 'Dia de los Muertos is the Mexican holiday celebrated in Coco', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What company does Mr Incredible work for as a claims adjuster?', '["Insuricare", "SafeCo", "Metrolife", "SecureAll"]', 0, 'Insuricare is where Bob Parr works his boring desk job', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'In Monsters Inc what powers the city?', '["Screams", "Laughs", "Dreams", "Tears"]', 0, 'Monstropolis is powered by childrens screams until they discover laughs work better', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'pixar'), 'What is the Pizza Planet truck?', '["A recurring Easter egg in Pixar films", "Als delivery truck", "A character in Cars", "Andys toy"]', 0, 'The Pizza Planet truck appears in nearly every Pixar film as an Easter egg', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is Baby Yodas real name?', '["Yoda Jr", "Grogu", "Yaddle", "Minch"]', 1, 'Grogu is the real name of the Child revealed in The Mandalorian', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What planet is Luke Skywalker from?', '["Alderaan", "Tatooine", "Naboo", "Coruscant"]', 1, 'Luke grew up on the desert planet Tatooine with his uncle and aunt', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What color is Mace Windus lightsaber?', '["Blue", "Green", "Purple", "Red"]', 2, 'Mace Windu has a unique purple lightsaber requested by Samuel L Jackson', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Who is Kylo Rens mother?', '["Padme Amidala", "Princess Leia", "Rey", "Jyn Erso"]', 1, 'Kylo Ren is Ben Solo son of Leia Organa and Han Solo', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'What is the name of Han Solos ship?', '["X-Wing", "TIE Fighter", "Millennium Falcon", "Star Destroyer"]', 2, 'The Millennium Falcon is Hans famous light freighter', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'star-wars'), 'Which planet is destroyed by the Death Star in A New Hope?', '["Naboo", "Alderaan", "Coruscant", "Tatooine"]', 1, 'Alderaan Princess Leias home planet is destroyed by the Death Star', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the name of Thors hammer?', '["Stormbreaker", "Mjolnir", "Gungnir", "Hofund"]', 1, 'Mjolnir is Thors enchanted hammer that only the worthy can lift', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is Tony Starks superhero name?', '["Steel Man", "Iron Man", "Metal Man", "Titanium Man"]', 1, 'Tony Stark is Iron Man genius billionaire playboy philanthropist', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What planet is Gamora from?', '["Xandar", "Zen-Whoberi", "Titan", "Knowhere"]', 1, 'Gamora is from Zen-Whoberi before Thanos adopted her', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What is the name of the fictional metal in Black Panther?', '["Adamantium", "Vibranium", "Uru", "Carbonadium"]', 1, 'Vibranium is found in Wakanda and makes up Captain Americas shield', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'Who is the villain in the first Avengers movie?', '["Ultron", "Thanos", "Loki", "Red Skull"]', 2, 'Loki leads the Chitauri invasion of New York in The Avengers', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'marvel'), 'What stone is in Visions forehead?', '["Space Stone", "Mind Stone", "Time Stone", "Soul Stone"]', 1, 'The Mind Stone powers Vision and was originally in Lokis scepter', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in The Little Mermaid?', '["Maleficent", "Cruella", "Ursula", "Mother Gothel"]', 2, 'Ursula is the sea witch who tricks Ariel into trading her voice', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is the name of the villain in 101 Dalmatians?', '["Ursula", "Cruella de Vil", "Lady Tremaine", "Queen of Hearts"]', 1, 'Cruella de Vil wants to make a fur coat from dalmatian puppies', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is Simbas evil uncle in The Lion King?', '["Mufasa", "Scar", "Zazu", "Rafiki"]', 1, 'Scar kills Mufasa and takes over Pride Rock', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What villain says Off with their heads?', '["Cruella de Vil", "Maleficent", "Queen of Hearts", "Evil Queen"]', 2, 'The Queen of Hearts from Alice in Wonderland loves ordering beheadings', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who cursed Aurora in Sleeping Beauty?', '["Evil Queen", "Ursula", "Maleficent", "Mother Gothel"]', 2, 'Maleficent cursed Aurora to prick her finger on a spindle', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What is Jafars position in Agrabah?', '["King", "Sultan", "Royal Vizier", "Guard Captain"]', 2, 'Jafar is the Royal Vizier who wants to take over Agrabah', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'Who is the villain in Tangled?', '["Mother Gothel", "Lady Tremaine", "Yzma", "Ursula"]', 0, 'Mother Gothel kidnapped Rapunzel to use her magical hair', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'villains'), 'What does Hades rule in Hercules?', '["Mount Olympus", "The Ocean", "The Underworld", "The Sky"]', 2, 'Hades is god of the Underworld and wants to overthrow Zeus', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'How many official Disney Princesses are there?', '["10", "12", "14", "15"]', 1, 'There are 12 official Disney Princesses in the lineup', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Who is the first Disney Princess?', '["Cinderella", "Snow White", "Aurora", "Ariel"]', 1, 'Snow White from 1937 is the first Disney Princess', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess has the power to heal with her hair?', '["Elsa", "Rapunzel", "Moana", "Pocahontas"]', 1, 'Rapunzels magical hair can heal injuries and reverse aging', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess is not royalty by birth or marriage?', '["Cinderella", "Mulan", "Aurora", "Jasmine"]', 1, 'Mulan is a warrior not a princess but is honorary', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'What is Ariels fathers name?', '["Poseidon", "Neptune", "Triton", "Aquaman"]', 2, 'King Triton is Ariels father and ruler of Atlantica', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess talks to animals and has forest friends?', '["Snow White", "Aurora", "Cinderella", "All of the above"]', 3, 'Snow White Aurora and Cinderella all communicate with animals', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Who is the youngest Disney Princess?', '["Snow White", "Jasmine", "Ariel", "Moana"]', 0, 'Snow White is canonically 14 years old the youngest princess', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'princesses'), 'Which princess cuts her hair in her movie?', '["Mulan", "Rapunzel", "Pocahontas", "Both A and B"]', 3, 'Both Mulan and Rapunzel cut their hair in their films', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who composed the music for The Lion King?', '["Alan Menken", "Hans Zimmer", "Randy Newman", "Danny Elfman"]', 1, 'Hans Zimmer composed the score with songs by Elton John and Tim Rice', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Which movie features the song A Whole New World?', '["The Little Mermaid", "Beauty and the Beast", "Aladdin", "Mulan"]', 2, 'A Whole New World is from Aladdin sung on the magic carpet ride', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who wrote the songs for Frozen?', '["Kristen Anderson-Lopez and Robert Lopez", "Alan Menken", "Lin-Manuel Miranda", "Randy Newman"]', 0, 'The Lopez duo wrote Let It Go and all Frozen songs', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What Disney movie features the song Under the Sea?', '["Moana", "Finding Nemo", "The Little Mermaid", "Lilo and Stitch"]', 2, 'Under the Sea is Sebastians song in The Little Mermaid', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who composed most Disney Renaissance films like Little Mermaid and Beauty and the Beast?', '["Hans Zimmer", "Alan Menken", "John Williams", "Danny Elfman"]', 1, 'Alan Menken composed 8 Disney films including the Renaissance era', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Which movie features the song How Far Ill Go?', '["Moana", "Frozen", "Tangled", "Brave"]', 0, 'How Far Ill Go is Moanas signature song written by Lin-Manuel Miranda', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'What song does Elsa sing when building her ice palace?', '["Do You Want to Build a Snowman", "Let It Go", "For the First Time in Forever", "Into the Unknown"]', 1, 'Let It Go plays as Elsa builds her ice palace and embraces her powers', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'music'), 'Who wrote the songs for Encanto?', '["Lin-Manuel Miranda", "Alan Menken", "Robert Lopez", "Kristen Anderson-Lopez"]', 0, 'Lin-Manuel Miranda wrote all songs including We Dont Talk About Bruno', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What year did Disneyland open?', '["1950", "1955", "1960", "1965"]', 1, 'Disneyland opened July 17 1955 in Anaheim California', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the name of the castle at Magic Kingdom?', '["Sleeping Beauty Castle", "Cinderella Castle", "Beast Castle", "Snow White Castle"]', 1, 'Cinderella Castle is the 189 foot icon of Magic Kingdom', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the Star Wars land called?', '["Star Wars Land", "Galaxys Edge", "Batuu Territory", "Outer Rim"]', 1, 'Star Wars Galaxys Edge is set on the planet Batuu', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'How many Disney theme park resorts exist worldwide?', '["4", "5", "6", "7"]', 2, 'There are 6 Disney resorts in California Florida Tokyo Paris Hong Kong and Shanghai', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is a Hidden Mickey?', '["Secret meet and greet", "Mickey shaped design hidden in parks", "Private dining", "After hours event"]', 1, 'Hidden Mickeys are subtle Mickey shapes hidden throughout Disney parks', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the spherical structure at EPCOT called?', '["The Globe", "Spaceship Earth", "Future World", "Geosphere"]', 1, 'Spaceship Earth is the iconic geodesic sphere at EPCOTs entrance', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'Which Disney park is the largest by acreage?', '["Magic Kingdom", "Disneyland", "Animal Kingdom", "Shanghai Disneyland"]', 2, 'Animal Kingdom is about 580 acres the largest Disney park', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What is the mine train coaster at Magic Kingdom?', '["Thunder Mountain", "Big Thunder Mountain Railroad", "Mine Train Adventure", "Gold Rush Mountain"]', 1, 'Big Thunder Mountain Railroad is the wildest ride in the wilderness', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What famous phrase is at Disneyland entrance?', '["Where Magic Lives", "Happiest Place on Earth", "Where Dreams Come True", "Magic is Here"]', 1, 'The Happiest Place on Earth is Disneylands famous tagline', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'parks'), 'What year did Walt Disney World open?', '["1965", "1968", "1971", "1975"]', 2, 'Magic Kingdom opened October 1 1971', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What was the first Disney cruise ship?', '["Disney Wonder", "Disney Magic", "Disney Dream", "Disney Fantasy"]', 1, 'Disney Magic launched in 1998 as the first Disney cruise ship', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is Disneys private island called?', '["Paradise Island", "Disney Island", "Castaway Cay", "Magic Island"]', 2, 'Castaway Cay is Disneys private Bahamas island', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'How many ships are in the Disney Cruise fleet as of 2024?', '["4", "5", "6", "7"]', 1, 'Disney has 5 ships Magic Wonder Dream Fantasy and Wish', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the adults only area on Disney ships called?', '["Adult Cove", "Quiet Cove", "Serenity Bay", "Adults Zone"]', 1, 'Quiet Cove has the adults only pool and relaxation areas', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What unique dining concept does Disney Cruise use?', '["Fixed dining", "Buffet only", "Rotational dining", "Room service only"]', 2, 'Rotational dining means you visit different restaurants but keep your servers', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the kids club on Disney cruise ships?', '["Mickeys Club", "Oceaneer Club", "Kids Cove", "Disney Kids Club"]', 1, 'Oceaneer Club is for kids ages 3-12', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is Disneys newest ship as of 2022?', '["Disney Treasure", "Disney Wish", "Disney Adventure", "Disney Destiny"]', 1, 'Disney Wish debuted July 2022', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is the adult beach on Castaway Cay?', '["Paradise Beach", "Serenity Bay", "Quiet Beach", "Adults Cove"]', 1, 'Serenity Bay is the adults only beach', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What does the ship horn play when departing?', '["Traditional horn", "When You Wish Upon a Star", "Mickey Mouse March", "Sailing Away"]', 1, 'Disney ships play When You Wish Upon a Star on departure', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'cruise'), 'What is Pirate Night on Disney Cruise?', '["Themed dinner", "Deck party with fireworks", "Character meet and greet", "All of the above"]', 3, 'Pirate Night includes dinner deck party costumes and fireworks', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year was Walt Disney born?', '["1899", "1901", "1905", "1910"]', 1, 'Walt Disney was born December 5 1901 in Chicago', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was Walt Disneys brothers name?', '["Robert", "Roy O Disney", "Raymond", "Richard"]', 1, 'Roy O Disney cofounded Disney with Walt in 1923', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was Mickey Mouses original name?', '["Mortimer Mouse", "Milton Mouse", "Martin Mouse", "Morris Mouse"]', 0, 'Walt wanted Mortimer but wife Lillian suggested Mickey', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What year did Mickey Mouse debut?', '["1920", "1925", "1928", "1932"]', 2, 'Mickey debuted in Steamboat Willie on November 18 1928', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'Where is Walt Disney buried?', '["Forest Lawn Cemetery", "Disneyland", "Walt Disney World", "He was cremated"]', 3, 'Walt Disney was cremated and his ashes are at Forest Lawn in Glendale', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'walt-history'), 'What was the name of Walts first successful cartoon character?', '["Mickey Mouse", "Oswald the Lucky Rabbit", "Donald Duck", "Goofy"]', 1, 'Oswald was created before Mickey but Walt lost the rights', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What was the first Disney Broadway musical?', '["Beauty and the Beast", "The Lion King", "The Little Mermaid", "Aladdin"]', 0, 'Beauty and the Beast opened on Broadway in 1994', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What is the longest running Disney Broadway show?', '["Beauty and the Beast", "The Lion King", "Aladdin", "Frozen"]', 1, 'The Lion King has run since 1997 and is 3rd longest running Broadway show ever', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which Disney Broadway show features puppetry by Julie Taymor?', '["Beauty and the Beast", "The Lion King", "Aladdin", "Mary Poppins"]', 1, 'Julie Taymors puppetry and masks are iconic in The Lion King', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'What Disney movie became a Broadway show in 2014?', '["Frozen", "Aladdin", "The Little Mermaid", "Newsies"]', 1, 'Aladdin opened on Broadway in March 2014', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'broadway'), 'Which show features the song Seize the Day?', '["Newsies", "The Lion King", "Aladdin", "Tarzan"]', 0, 'Seize the Day is the Act 1 finale of Newsies', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What flavor is the famous Dole Whip?', '["Orange", "Pineapple", "Mango", "Coconut"]', 1, 'Pineapple Dole Whip is the iconic Disney parks frozen treat', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the bestselling food item at Disney parks?', '["Turkey Legs", "Churros", "Dole Whip", "Mickey Pretzels"]', 1, 'Churros are the top seller with millions sold annually', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the name of the restaurant inside Pirates of the Caribbean at Disneyland?', '["The Blue Lagoon", "Blue Bayou", "Captain Jacks", "Pirates Cove"]', 1, 'Blue Bayou is the atmospheric restaurant inside the ride', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What shape are the famous Disney ice cream bars?', '["Mickey head", "Castle", "Star", "Circle"]', 0, 'Mickey Premium Ice Cream Bars are shaped like Mickeys head', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What is the signature drink at Ogas Cantina in Galaxys Edge?', '["Blue Milk", "Fuzzy Tauntaun", "Jedi Mind Trick", "All are signature drinks"]', 3, 'Ogas Cantina has many signature drinks including Blue Milk', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'food'), 'What restaurant has the 50s TV dinner theme at Hollywood Studios?', '["Sci-Fi Dine-In", "50s Prime Time Cafe", "Hollywood and Vine", "ABC Commissary"]', 1, '50s Prime Time Cafe servers act as family members from the 50s', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What does Ohana mean in Lilo and Stitch?', '["Love", "Friend", "Family", "Together"]', 2, 'Ohana means family and family means nobody gets left behind', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Which Disney Princess is based on a real person?', '["Mulan", "Pocahontas", "Moana", "Merida"]', 1, 'Pocahontas is based on a real Native American woman from the 1600s', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What is Buzz Lightyears famous catchphrase?', '["Youve got a friend in me", "To infinity and beyond", "Reach for the sky", "Im a space ranger"]', 1, 'To infinity and beyond is Buzzs iconic catchphrase', 'easy');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Which Disney animated film has both parents alive throughout?', '["Tangled", "Sleeping Beauty", "101 Dalmatians", "Mulan"]', 3, 'In Mulan both parents are present and alive the whole film', 'hard');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'What A113 refers to in Pixar films?', '["Secret code", "CalArts classroom number", "Hidden Mickey", "Directors birthday"]', 1, 'A113 is the CalArts classroom where many Pixar animators studied', 'medium');

INSERT INTO questions (category_id, question, options, correct_answer, explanation, difficulty) VALUES ((SELECT id FROM categories WHERE slug = 'mixed'), 'Who voiced both Darth Vader and Mufasa?', '["Morgan Freeman", "James Earl Jones", "Samuel L Jackson", "Keith David"]', 1, 'James Earl Jones iconic voice brought both characters to life', 'medium');