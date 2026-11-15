// Proseidon question bank. Shared by the game and the server.
import { WN, ADD, FIX } from "./bank-v5.js";
import { EDIT, MORE } from "./bank-v6.js";
import { LAB, MATCH } from "./bank-v7.js";
import { MYTHS, ADD8, EDIT8, TIPS } from "./bank-v8.js";
export { TIPS };
const RAW=[
{t:"Parts of speech",l:"Every word has a job. Nouns name things. Verbs show action or being. Adjectives describe nouns. Adverbs describe verbs, adjectives, or other adverbs. Pronouns stand in for nouns. Prepositions show position or relation (under, to, after). Conjunctions join (and, but, so). Interjections show feeling (wow). The same word can do different jobs in different sentences.",q:[
["Which word is a pronoun? “She handed the report to Mark.”",["handed","report","She","to"],2,"“She” stands in for a person's name."],
["Which word is an adjective? “The tired baker rested.”",["The","tired","baker","rested"],1,"“Tired” describes the baker."],
["Which word is an adverb? “They answered the call slowly.”",["They","answered","call","slowly"],3,"“Slowly” tells how they answered."],
["Which word is a preposition? “The file is under the desk.”",["file","under","is","desk"],1,"“Under” shows where the file is in relation to the desk."],
["Which word is a conjunction? “I wanted coffee, but the pot was empty.”",["but","wanted","coffee","empty"],0,"“But” joins the two halves of the sentence."],
["Which word is an interjection? “Wow, that was fast!”",["that","fast","Wow","was"],2,"“Wow” is a burst of feeling."],
["Which word is the verb? “Compliance reviews every ad.”",["Compliance","reviews","every","ad"],1,"“Reviews” is the action here. In another sentence, “reviews” could be a noun."],
["In “Happiness matters,” what part of speech is “Happiness”?",["Verb","Adjective","Adverb","Noun"],3,"“Happiness” names a thing (an idea), so it's a noun."],
["Which word is a noun? “The quiet office felt empty.”",["quiet","office","felt","empty"],1,"“Office” names a place."],
["In “She runs fast,” what part of speech is “fast”?",["Adjective","Adverb","Noun","Verb"],1,"“Fast” tells how she runs, so here it's an adverb. In “a fast car,” it would be an adjective."],
["Which word is a pronoun? “The client called, and we answered.”",["client","called","and","we"],3,"“We” stands in for the people answering."],
["In “Run the report,” what part of speech is “Run”?",["Noun","Verb","Adjective","Preposition"],1,"It's an action, given as a command."],
["Which word is a preposition? “We met after lunch.”",["met","after","lunch","We"],1,"“After” links “lunch” to when we met."],
["Which word is an adjective? “He wrote a brief memo.”",["He","wrote","brief","memo"],2,"“Brief” describes the memo."],
["In “The meeting ran long, so we left,” what is “so”?",["Adverb","Conjunction","Preposition","Pronoun"],1,"“So” joins two complete thoughts, so it's a conjunction."]]},
{t:"Sentence basics",l:"The verb must match its real subject. Cross out phrases starting with “of,” “with,” or “along with” to find it. “Each,” “every,” “everyone,” and “neither” are singular. With “neither/nor” and “either/or,” match the noun closest to the verb. After “there is/are,” match the noun that follows. “The number” is singular; “a number” is plural. A full sentence needs a subject and a verb and must stand on its own.",q:[
["“The box of cookies ___ on the counter.”",["is","are","were","be"],0,"The subject is “box,” which is singular. “Of cookies” only describes it."],
["“The list of names ___ long.”",["are","is","were","have been"],1,"Cross out “of names.” The list is long."],
["“Each of the managers ___ a key.”",["have","has","are having","were having"],1,"“Each” is singular, so it takes “has.”"],
["“Neither the reps nor the manager ___ ready.”",["are","were","is","be"],2,"With “neither/nor,” match the closer noun: “manager is.”"],
["Which is a complete sentence?",["Because the market closed.","Running late again.","The market closed early.","After the meeting ended."],2,"Only “The market closed early” has a subject and verb and stands alone."],
["In US English: “The team ___ meeting at noon.”",["is","are","be","were"],0,"In US English, a group acting as one unit usually takes a singular verb. British English often uses “are.”"],
["Which is a run-on sentence?",["I filed it. Then I left.","I filed it, and then I left.","I filed it then I left.","After filing it, I left."],2,"Two full sentences run together with no punctuation or joining word."],
["“Everyone ___ invited to the meeting.”",["are","is","were","have been"],1,"“Everyone” is singular, so “is.”"],
["“The cost of the new laptops ___ too high.”",["are","is","were","have been"],1,"Cross out “of the new laptops.” The cost is too high."],
["“Either the managers or the CEO ___ the memo.”",["sign","signs","are signing","have signed"],1,"Match the closer noun, “CEO,” which is singular: “signs.”"],
["“Neither the CEO nor the managers ___ the memo.”",["signs","has signed","sign","is signing"],2,"Match the closer noun, “managers,” which is plural: “sign.”"],
["Which is a sentence fragment?",["The report is late.","Although the report is late.","The report is late, but it's good.","Is the report late?"],1,"“Although” leaves the thought unfinished. It can't stand alone."],
["“There ___ three files on the desk.”",["is","are","was","has been"],1,"After “there,” match the noun that follows: three files are."],
["“Every manager and rep ___ trained.”",["are","is","were","have been"],1,"When “every” comes before a joined subject, the verb is singular."],
["“The number of complaints ___ dropping.”",["are","is","were","have been"],1,"“The number” is singular. (“A number of complaints are” would be plural.)"]]},
{t:"Punctuation",l:"“It's” only ever means “it is” or “it has.” A comma splice glues two full sentences with only a comma; fix it with a period, a semicolon, or a comma plus and, but, or so. Singular possessives add 's (manager's); plural possessives ending in s add only the apostrophe (clients'). A colon follows a complete sentence. Set off extra information with a pair of commas. In US English, periods and commas go inside closing quotes.",q:[
["Which is correct?",["Its raining, we should leave.","It's raining, we should leave.","Its raining; we should leave.","It's raining; we should leave."],3,"“It's” means “it is,” and two full sentences need a semicolon (or a period), not just a comma."],
["“The dog wagged ___ tail.”",["it's","its","its'","it is"],1,"Possessive “its” has no apostrophe. Test it: “it is tail” makes no sense."],
["Which fixes the comma splice “I'm tired, I'm going home”?",["I'm tired, I'm going, home.","I'm tired, so I'm going home.","I'm tired I'm going home.","I'm, tired, I'm going home."],1,"Adding “so” after the comma joins the two sentences correctly."],
["The files belong to several clients. Which is correct?",["the client's files","the clients files","the clients' files","the clients's files"],2,"Plural noun ending in s: the apostrophe goes after the s."],
["Which uses a colon correctly?",["Bring: a pen and paper.","Bring two things: a pen and paper.","The items are: pen and paper.","We need: help."],1,"A colon should follow a complete sentence. “Bring two things” is complete."],
["Which is punctuated best?",["After the meeting ended, we left.","After, the meeting ended we left.","After the meeting, ended we left.","After the meeting ended we, left."],0,"Use a comma after an opening dependent clause."],
["Which is correct in US English?",["He said, “Call me”.","He said, “Call me.”","He said “Call me”.","He said, “Call me.”."],1,"In US style, the period goes inside the closing quotation mark."],
["Which is correct before a noun?",["a well known author","a well-known author","a well known-author","a-well-known author"],1,"Two words working together as one adjective before a noun get a hyphen."],
["Which is correct when inviting Grandma to eat?",["Let's eat, Grandma.","Lets eat, Grandma.","Let's eat Grandma.","Lets eat Grandma."],0,"“Let's” is short for “let us,” and a comma sets off the person you're talking to."],
["Which uses a semicolon correctly?",["I called; but she was out.","I called; she was out.","I called; and left.","I; called her."],1,"A semicolon joins two full sentences without a joining word."],
["Something belongs to one manager. Which is correct?",["the managers' desk","the manager's desk","the managers desk","the manager desk's"],1,"One owner: add 's to the noun."],
["Which list is punctuated correctly (using the serial comma)?",["We need pens, paper, and tape.","We need pens paper, and tape.","We need, pens, paper, and tape.","We need pens, paper and, tape."],0,"Commas separate the items. The serial comma before “and” is optional in some styles but adds clarity."],
["Which sets off the extra detail correctly?",["The firm, which opened in 1990 is growing.","The firm which opened in 1990, is growing.","The firm, which opened in 1990, is growing.","The firm which, opened in 1990, is growing."],2,"Extra information needs a comma on both sides."],
["Which writes the decade correctly?",["The 1990's were busy.","The 1990s were busy.","The 1990s' were busy.","The 1990's' were busy."],1,"A plural decade needs no apostrophe."],
["Which correctly joins “I'd go. It's too late.”?",["I'd go, however, it's too late.","I'd go; however, it's too late.","I'd go however it's too late.","I'd go, however it's too late."],1,"When “however” joins two full sentences, put a semicolon before it and a comma after it."]]},
{t:"Confused words",l:"Affect is the Action (verb); Effect is the End result (noun). Their = belongs to them, there = place, they're = they are. Fewer for things you count, less for amounts. Principal = main or a person in charge; principle = a rule. Who does the action; whom receives it (try he/him). Than compares; then is about time. Accept = receive; except = leave out. Ensure = make certain.",q:[
["“The new policy will ___ every department.”",["effect","affect","affects","effects"],1,"You need a verb after “will”: affect."],
["“The rain had a big ___ on sales.”",["affect","effect","affected","affecting"],1,"After “a big,” you need a noun: effect."],
["“___ going to the meeting at noon.”",["Their","There","They're","Theirs"],2,"“They are going” fits, so “They're.”"],
["“We had ___ complaints this year.”",["less","fewer","lesser","more less"],1,"You can count complaints, so “fewer.”"],
["“The firm's ___ reviewed the ad.”",["principle","principal","principals'","principled"],1,"A person in charge is a principal. A principle is a rule."],
["“Send the report to Mark and ___.”",["I","me","myself","mine"],1,"Drop “Mark and”: “send the report to me.”"],
["“To ___ should I send it?”",["who","whom","whose","who's"],1,"It receives the action (send it to him), so “whom.”"],
["“___ approval is needed.”",["You're","Your","Yore","You are"],1,"It shows ownership, so “your.”"],
["“She is taller ___ her brother.”",["then","than","that","thin"],1,"“Than” compares. “Then” is about time."],
["“I'll ___ your request.”",["except","accept","expect","excess"],1,"“Accept” means to receive or agree to."],
["“Don't ___ the key.”",["loose","lose","loss","lost"],1,"“Lose” means to misplace. “Loose” means not tight."],
["“The blue tie ___ his suit.”",["compliments","complements","complement","compliment"],1,"“Complements” means goes well with. A compliment is praise."],
["“___ laptop is this?”",["Who's","Whose","Who","Whom"],1,"“Whose” shows ownership. “Who's” means “who is.”"],
["“She ___ the meeting yesterday.”",["lead","led","leaded","lede"],1,"The past tense of “lead” is “led.”"],
["“Please ___ the form is signed.”",["insure","ensure","assure","ensures"],1,"“Ensure” means make certain. “Insure” is about insurance; “assure” means to promise someone."]]},
{t:"Clauses",l:"A clause has a subject and a verb. Independent clauses stand alone. Dependent clauses start with words like although, because, since, when, if, who, that, or what, and lean on another clause. A phrase has no subject-verb pair. Simple = one independent clause. Compound = two or more independent. Complex = one independent plus a dependent. Compound-complex = both.",q:[
["In “Although the report was late, the client approved it,” what is “Although the report was late”?",["Independent clause","Prepositional phrase","Dependent clause","Appositive"],2,"It has a subject and verb, but “Although” stops it from standing alone."],
["Which word starts a dependent clause?",["and","because","but","so"],1,"“Because” makes a clause lean on another one."],
["Which can stand alone as a sentence?",["When the bell rang","Since we left","The bell rang","If you call"],2,"“The bell rang” is complete. The others leave you waiting."],
["In “The rep who called yesterday left a message,” what is “who called yesterday”?",["Relative (adjective) clause","Independent clause","Adverb clause","Prepositional phrase"],0,"It describes which rep, so it works like an adjective."],
["“I filed it, and she approved it.” What type of sentence?",["Simple","Compound","Complex","Compound-complex"],1,"Two independent clauses joined by “and.”"],
["“Because it rained, we stayed in, and we read.” What type?",["Simple","Compound","Complex","Compound-complex"],3,"Two independent clauses plus one dependent clause."],
["In “Mark, our CEO, approved it,” what is “our CEO”?",["Dependent clause","Appositive","Independent clause","Verb phrase"],1,"An appositive renames the noun right before it."],
["“Before the market opens” is a:",["Complete sentence","Dependent clause","Independent clause","Compound sentence"],1,"It has a subject and verb but can't stand alone."],
["In “I stayed late because the deadline moved,” what is “because the deadline moved”?",["Independent clause","Adverb (dependent) clause","Appositive","Noun phrase"],1,"It tells why I stayed late, and it can't stand alone."],
["In “The report that you sent was clear,” which words form the relative clause?",["The report","that you sent","was clear","you sent was"],1,"“That you sent” describes which report."],
["“She left.” What type of sentence?",["Simple","Compound","Complex","Compound-complex"],0,"One independent clause, so it's simple. Short doesn't mean incomplete."],
["“When the market closed, we went home.” What type?",["Simple","Compound","Complex","Compound-complex"],2,"One independent clause plus one dependent clause."],
["In “What she said surprised me,” what is “What she said”?",["Noun clause","Adverb clause","Prepositional phrase","Independent clause"],0,"The whole clause is the subject of the sentence, so it works like a noun."],
["Which joins two independent clauses correctly?",["I called, she answered.","I called she answered.","I called, and she answered.","I called and, she answered."],2,"A comma plus “and” joins two full sentences."],
["In “The analyst, tired and hungry, kept working,” what is “tired and hungry”?",["Dependent clause","Adjective phrase","Independent clause","Noun clause"],1,"It has no subject and verb, so it's a phrase, and it describes the analyst."]]},
{t:"Concise writing",l:"Cut filler and hidden verbs. “Due to the fact that” = because. “In order to” = to. “At this point in time” = now. “In the event that” = if. “Make a decision” = decide. Prefer active voice: who did what. Drop openers like “It is important to note that” and “There are ... who.” Swap stiff words for plain ones: use, not utilize; begin, not commence.",q:[
["Best rewrite of: “Due to the fact that the meeting was in the morning, we made the decision to leave early.”",["Because the meeting was in the morning, we decided to leave early.","Due to the meeting being morning, leaving early was decided.","Because of the fact that it was morning, we made a decision to leave early.","The meeting being in the morning, the decision was made to leave early."],0,"“Because” replaces the filler and “decided” replaces the hidden verb."],
["Shortest way to say “at this point in time”?",["currently at present","now","at this time point","presently now"],1,"“Now” says it in one word."],
["Best fix for “We conducted an analysis of the data”?",["We did analysis on the data.","We analyzed the data.","An analysis of the data was conducted.","We conducted data analysis."],1,"The hidden verb “analysis” becomes “analyzed.”"],
["Which sentence is in active voice?",["The report was filed by Dan.","Dan filed the report.","The report has been filed.","Filing of the report was done."],1,"The doer (Dan) comes first and does the action."],
["Cut the redundancy: “past history”",["past","previous history","history","old past history"],2,"All history is in the past. “History” is enough."],
["Best rewrite of: “In order to complete the review, we need the files.”",["In order to complete the review, the files are needed.","For the purpose of completing the review, we need files.","To complete the review, we need the files.","We need, in order to complete the review, the files."],2,"“In order to” shrinks to “to.”"],
["Best rewrite of: “It is important to note that the deadline is Friday.”",["Note that it is important the deadline is Friday.","The deadline is Friday.","It is important that the deadline is Friday.","Importantly, it is noted the deadline is Friday."],1,"Just state it. The lead-in adds nothing."],
["Plain-language swap for “utilize”:",["employ","leverage","make utilization of","use"],3,"“Use” means the same thing and reads easier."],
["Plain-language swap for “commence”:",["initiate","begin","inaugurate","actuate"],1,"“Begin” says the same thing in a word everyone knows."],
["Cut the redundancy: “end result”",["result","final end result","end","ending result"],0,"A result is already the end. “Result” is enough."],
["Best rewrite of: “There are three reps who need training.”",["Three reps need training.","There are three reps needing training.","Three reps are who need training.","There exist three reps needing training."],0,"Drop “There are ... who” and start with the real subject."],
["Best rewrite of: “The meeting was attended by the whole team.”",["The whole team attended the meeting.","The meeting, by the whole team, was attended.","Attended by the whole team was the meeting.","The meeting had attendance by the whole team."],0,"Active voice puts the doer first: the team attended."],
["Plain-language swap for “in the event that”:",["if","provided that","assuming the case","in case of the event"],0,"“If” does the same job in one word."],
["Best rewrite of: “He is a person who works hard.”",["He works hard.","He is someone working hard.","He is a hard-working person who works.","A person who works hard is he."],0,"Cut “is a person who” and keep the action."],
["Which sentence is clearest?",["Please review and approve the ad by Friday.","It would be appreciated if review and approval of the ad could occur by Friday.","Review of the ad and approval thereof is requested by Friday.","By Friday, the ad's review and approval is something we need."],0,"It's short, active, and says who does what and when."]]},
{t:"Rhetoric",l:"Simile compares with like or as; metaphor says one thing is another. Hyperbole exaggerates. Litotes understates by denying the opposite (“not bad”). Personification gives human traits to things. Chiasmus repeats ideas in reverse order (A-B, B-A). Anaphora repeats the start of lines; epistrophe repeats the end. Oxymoron puts opposites side by side. Ethos, pathos, logos: appeals to credibility, emotion, and logic.",q:[
["“Ask not what your country can do for you; ask what you can do for your country.” Which figure?",["Hyperbole","Litotes","Onomatopoeia","Chiasmus"],3,"Ideas repeat in reverse order: country/you, then you/country. This exact-word version is also called antimetabole."],
["“I've told you a million times.”",["Litotes","Hyperbole","Chiasmus","Simile"],1,"Nobody said it a million times. That's exaggeration."],
["“That was not a small mistake,” meaning a big one.",["Litotes","Hyperbole","Metaphor","Alliteration"],0,"Saying “not small” to mean “big” is litotes."],
["“Time is money.”",["Simile","Metaphor","Personification","Irony"],1,"It says one thing is another without “like” or “as.”"],
["“The market woke up hungry.”",["Personification","Litotes","Chiasmus","Anaphora"],0,"Markets don't wake up or feel hungry. Human traits, non-human thing."],
["“As a 20-year compliance officer, I can tell you this works.” Which appeal?",["Pathos","Logos","Ethos","Kairos"],2,"It leans on the speaker's credibility: ethos."],
["“We will check it. We will test it. We will ship it.”",["Epistrophe","Anaphora","Zeugma","Oxymoron"],1,"Repeating the same opening words is anaphora."],
["“Jumbo shrimp”",["Oxymoron","Paradox","Metaphor","Pun"],0,"Two opposite ideas side by side."],
["“Her smile was like sunshine.”",["Metaphor","Simile","Hyperbole","Litotes"],1,"It compares using “like,” so it's a simile."],
["“Buzz,” “sizzle,” and “bang” are examples of:",["Alliteration","Onomatopoeia","Assonance","Irony"],1,"They sound like what they describe."],
["“Peter Piper picked a peck” uses:",["Alliteration","Anaphora","Chiasmus","Zeugma"],0,"The same first sound (p) repeats in nearby words."],
["“Our sales chart shows a 40% rise.” Which appeal?",["Ethos","Pathos","Logos","Kairos"],2,"It uses evidence and numbers, so it appeals to logic."],
["“Think of the families who will lose their homes.” Which appeal?",["Ethos","Pathos","Logos","Kairos"],1,"It aims at feelings, so it's pathos."],
["A fire station burning down is an example of:",["Situational irony","Simile","Litotes","Anaphora"],0,"The outcome is the opposite of what you'd expect."],
["“We came for the truth. We fought for the truth. We won with the truth.”",["Anaphora","Epistrophe","Oxymoron","Simile"],1,"Repeating the same ending words is epistrophe."]]},
{t:"Advanced grammar",l:"The subjunctive covers things that aren't real, wishes, and demands: “If I were,” “I wish it were,” “requires that he be,” “essential that she sign.” Past unreal: “If she had seen it, she would have replied.” Passive voice puts the receiver first. Pronouns after prepositions take object form (between you and me). Modifiers sit next to what they describe. Lie = recline; lay = put something down.",q:[
["In formal writing: “If I ___ you, I would file the report today.”",["was","were","am","be"],1,"An imagined situation uses the subjunctive “were.”"],
["“I wish it ___ Friday.”",["was","is","were","be"],2,"A wish isn't real, so formal writing uses “were.”"],
["“The policy requires that each rep ___ trained.”",["is","be","was","are"],1,"After “requires that,” the subjunctive uses the base form “be.”"],
["Which sentence is in passive voice?",["The rep sent the email.","The email was sent by the rep.","The rep is sending the email.","The rep will send the email."],1,"The receiver (email) comes first, and the doer follows “by.”"],
["“She is one of the reps who ___ certified.”",["are","is","was","be"],0,"“Who” refers to “reps” (plural), so “are.”"],
["“Give it to ___ asks first.”",["whoever","whomever","whom","who's"],0,"It's the subject of “asks,” so “whoever,” even after “to.”"],
["Which has no dangling modifier?",["Walking into the office, the alarm went off.","The alarm went off walking into the office.","Walking into the office, I heard the alarm.","Walking into the office, there was an alarm."],2,"“I” is the one walking, and “I” comes right after the phrase."],
["“I need to ___ down for a minute.”",["lay","laid","layed","lie"],3,"You recline, with no object, so “lie.”"],
["“It is essential that she ___ the form today.”",["signs","sign","signed","will sign"],1,"After “essential that,” the subjunctive uses the base form: “sign.”"],
["In formal writing: “The rep ___ we hired starts Monday.”",["who","whom","whose","which"],1,"We hired him, so the object form: “whom.” Many people say “who” in casual speech."],
["“Between you and ___, the plan is risky.”",["I","me","myself","mine"],1,"After a preposition like “between,” use the object form: “me.”"],
["In formal writing: “It was ___ who called.”",["her","she","hers","herself"],1,"After “it was,” formal writing uses the subject form. “It was her” is common in speech."],
["Which places “almost” correctly to mean she read most of the report?",["She almost read the whole report.","She read almost the whole report.","Almost she read the whole report.","She read the whole almost report."],1,"“Almost” should sit next to what it limits. “Almost read” means she nearly started."],
["“If she ___ the email, she would have replied.”",["saw","had seen","has seen","would have seen"],1,"An unreal past condition uses “had” plus the past participle."],
["In formal writing: “Neither of the reports ___ ready.”",["are","is","were","have been"],1,"“Neither” on its own is singular in formal writing."]]},
{t:"Linguistics",l:"A morpheme is the smallest unit of meaning. Free morphemes stand alone (book); bound ones can't (-ing). New words form by blending (brunch), clipping (ad), compounding (notebook), acronyms (laser), conversion (to google), back-formation (edit from editor), and borrowing. Phonetics studies speech sounds. Syntax studies structure. Semantics studies meaning. Pragmatics studies meaning in context.",q:[
["How many morphemes in “unhappiness”?",["1","2","3","4"],2,"un- + happy + -ness = 3."],
["How many morphemes in “cats”?",["1","2","3","4"],1,"cat + -s (plural) = 2."],
["How many morphemes in “replayed”?",["1","2","3","4"],2,"re- + play + -ed = 3."],
["“Brunch” (breakfast + lunch) was formed by:",["Blending","Clipping","Acronym","Borrowing"],0,"Parts of two words merged into one: blending."],
["“Ad” from “advertisement” was formed by:",["Blending","Clipping","Compounding","Coinage"],1,"Shortening a longer word is clipping."],
["The study of sentence structure is:",["Phonology","Semantics","Syntax","Pragmatics"],2,"Syntax covers how words combine into sentences."],
["“Can you pass the salt?” is understood as a request, not a question about ability. Which field studies this?",["Morphology","Syntax","Phonetics","Pragmatics"],3,"Pragmatics studies meaning in context."],
["“Schadenfreude” used in English is an example of:",["Borrowing (loanword)","Clipping","Back-formation","Blending"],0,"English took the word whole from German."],
["“Laser” (light amplification by stimulated emission of radiation) is a(n):",["Clipping","Acronym","Blend","Borrowing"],1,"It's built from first letters and said as a word."],
["The study of how speech sounds are physically made is:",["Phonetics","Pragmatics","Semantics","Morphology"],0,"Phonetics looks at the sounds themselves."],
["The verb “edit” came from the older noun “editor.” This is called:",["Back-formation","Clipping","Blending","Borrowing"],0,"People removed what looked like a suffix (-or) to make a new word."],
["Which is a bound morpheme (it can't stand alone)?",["book","-ing","run","happy"],1,"“-ing” only works attached to another word."],
["A noun turning into a verb with no change, like “just google it,” is called:",["Conversion","Clipping","Blending","Back-formation"],0,"The word changes jobs without changing form."],
["The study of word and sentence meaning is:",["Syntax","Semantics","Phonology","Morphology"],1,"Semantics studies meaning."],
["“Notebook” was formed by:",["Compounding","Clipping","Blending","Acronym"],0,"Two whole words joined into one."]]},
{t:"PhD level",l:"Garden-path sentences lead readers into the wrong structure, then force a restart. Chomsky's “colorless green ideas” shows grammar and meaning are separate. Performative utterances do what they say (“I pronounce you married”). Kairos is the opportune moment. Zeugma links one word to two others in different senses. Grice's maxims (quantity, quality, relation, manner) describe cooperative talk. Free indirect discourse blends a character's thoughts into narration. Anaphoric reference points back; cataphoric points forward.",q:[
["“The horse raced past the barn fell.” This is a classic:",["Garden-path sentence","Dangling modifier","Comma splice","Zeugma"],0,"You read “raced” as the main verb, then “fell” forces a restart. It means: the horse that was raced past the barn fell."],
["“The old man the boat.” What is “man” here?",["Noun","Verb","Adjective","Adverb"],1,"“The old” (old people) “man” (staff) the boat."],
["Why are garden-path sentences hard to read?",["They have spelling errors","The brain commits early to the wrong structure","They are too long","They lack verbs"],1,"We guess structure as we read, and these make the first guess wrong."],
["In classical rhetoric, “kairos” means:",["Appeal to emotion","Speaker credibility","The opportune moment","Logical proof"],2,"Kairos is saying the right thing at the right time."],
["“She took her coat and her leave.”",["Zeugma","Chiasmus","Anaphora","Litotes"],0,"“Took” links to two objects in two different senses. Some scholars call this type syllepsis."],
["Giving far more detail than a question needs breaks which of Grice's maxims?",["Quality","Quantity","Relation","Manner"],1,"Quantity: say as much as needed, no more, no less."],
["“Free indirect discourse” is:",["Quoting speech in quotation marks","Narration that blends a character's thoughts into third-person voice","A speech with no audience","A footnote style"],1,"The narrator's voice takes on the character's thoughts without quotation marks."],
["Descriptive grammar:",["Says how people should speak","Bans split infinitives","Only covers spelling","Records how people actually use language"],3,"Descriptive grammar observes. Prescriptive grammar sets rules."],
["Chomsky's “Colorless green ideas sleep furiously” shows that a sentence can be:",["Grammatical but meaningless","Meaningful but ungrammatical","A garden-path sentence","A comma splice"],0,"The structure is correct, but the meaning makes no sense."],
["In speech act theory, “I now pronounce you married” is a:",["Performative utterance","Rhetorical question","Garden-path sentence","Litotes"],0,"Saying it, in the right setting, does the act."],
["The Sapir-Whorf hypothesis claims that:",["Language shapes how we think","All languages share one grammar","Words have fixed meanings","Spelling reflects sound"],0,"It argues our language influences how we see the world."],
["Aristotle's three modes of persuasion are:",["Ethos, pathos, logos","Kairos, telos, mythos","Thesis, antithesis, synthesis","Invention, arrangement, style"],0,"Credibility, emotion, and logic."],
["The five canons of classical rhetoric are invention, arrangement, style, memory, and:",["Delivery","Logic","Emotion","Grammar"],0,"Delivery is how the speech is presented."],
["“Code-switching” means:",["Moving between languages or dialects in one conversation","Encrypting text","Changing a word's spelling","Translating word for word"],0,"Speakers shift between language varieties based on setting or audience."],
["“Mr. Smith was angry. He slammed the door.” “He” pointing back to “Mr. Smith” is called:",["Anaphoric reference","Cataphoric reference","Chiasmus","Zeugma"],0,"Anaphoric reference points back to something already named. Cataphoric reference points forward."]]}
];

const SK=[
{tags:"NMMCCCVNNMNVCMC",names:{N:"Nouns and pronouns",V:"Verbs",M:"Adjectives and adverbs",C:"Connecting words"}},
{tags:"OOSEFSFSOEEFSSO",names:{O:"Phrases that hide the subject",E:"Either/or and neither/nor",S:"Singular words like each and everyone",F:"Fragments and run-ons"}},
{tags:"JAJAPCPPCJACCAJ",names:{A:"Apostrophes",J:"Joining sentences",C:"Commas",P:"Colons, quotes, and hyphens"}},
{tags:"FFSWWPPSSSSSSSW",names:{F:"Affect vs. effect",S:"Sound-alike words",P:"I/me and who/whom",W:"Word choice"}},
{tags:"DDDRTTJDDRTTRJJ",names:{D:"Dependent vs. independent",R:"Relative and noun clauses",T:"Sentence types",J:"Phrases and joining"}},
{tags:"HHHAPHHPPPHAHHA",names:{H:"Filler and hidden verbs",A:"Active voice",P:"Plain words"}},
{tags:"RXXCCARXCRRAAXR",names:{C:"Comparisons",X:"Exaggeration and understatement",R:"Repetition and sound",A:"Appeals"}},
{tags:"SSSVAPVVSPPPVSA",names:{S:"Subjunctive and conditionals",P:"Pronoun case",A:"Tricky agreement",V:"Voice, modifiers, and tricky verbs"}},
{tags:"MMMWWFFWWFWMWFW",names:{M:"Morphemes",W:"Word formation",F:"Fields of linguistics"}},
{tags:"LLLCCUUULULCCLU",names:{L:"Language and the mind",C:"Classical rhetoric",U:"Meaning in use"}}
];
const EXTRA=[
[{type:"tap",p:"Tap the adverb.",s:["The","analyst","quietly","closed","the","file."],a:2,e:"“Quietly” tells how the analyst closed the file.",tag:"M"},
 {type:"tap",p:"Tap the preposition.",s:["She","left","the","badge","on","the","desk."],a:4,e:"“On” shows where the badge is in relation to the desk.",tag:"C"},
 {type:"type",p:"Type the pronoun that replaces “Mark and Lisa”: “Mark and Lisa called. ___ were upset.”",acc:["They"],e:"“They” stands in for two people.",tag:"N"}],
[{type:"tap",p:"Tap the word that's wrong.",s:["The","list","of","approved","vendors","are","long."],a:5,fix:"is",e:"The subject is “list,” which is singular, so it should be “is.”",tag:"O"},
 {type:"tap",p:"Tap the word that's wrong.",s:["Each","of","the","reps","have","a","login."],a:4,fix:"has",e:"“Each” is singular, so it should be “has.”",tag:"S"},
 {type:"type",p:"Type “is” or “are”: “Neither the manager nor the reps ___ ready.”",acc:["are"],e:"Match the closer noun, “reps,” which is plural: “are.”",tag:"E"}],
[{type:"tap",p:"Tap the word that's wrong.",s:["The","firm","updated","it's","website."],a:3,fix:"its",e:"Possessive “its” has no apostrophe. “It's” means “it is.”",tag:"A"},
 {type:"tap",p:"Tap the word where the comma splice happens.",s:["I","sent","the","memo,","nobody","replied."],a:3,e:"The comma after “memo” joins two full sentences. Use a period or semicolon, or add “but.”",tag:"J"},
 {type:"type",p:"Type the possessive form of “children” (as in “the ___ books”).",acc:["children's"],e:"For a plural that doesn't end in s, add 's.",tag:"A"}],
[{type:"tap",p:"Tap the word that's wrong.",s:["Their","going","to","file","the","report","today."],a:0,fix:"They're",e:"“They are going” is meant, so “They're.”",tag:"S"},
 {type:"tap",p:"Tap the word that's wrong.",s:["We","received","less","complaints","this","quarter."],a:2,fix:"fewer",e:"You can count complaints, so “fewer.”",tag:"W"},
 {type:"type",p:"Type “affect” or “effect”: “The new rule had a big ___ on sales.”",acc:["effect"],e:"After “a big,” you need a noun: effect.",tag:"F"}],
[{type:"tap",p:"Tap the word that starts the dependent clause.",s:["We","stayed","late","because","the","audit","ran","long."],a:3,e:"“Because” turns “the audit ran long” into a clause that can't stand alone.",tag:"D"},
 {type:"tap",p:"Tap the word that starts the relative clause.",s:["The","rep","who","called","you","is","new."],a:2,e:"“Who called you” describes the rep, and “who” starts it.",tag:"R"},
 {type:"type",p:"Type one joining word that fits: “I called, ___ she didn't answer.”",acc:["but","yet"],e:"A comma plus “but” (or “yet”) joins two full sentences and shows contrast.",tag:"J"}],
[{type:"tap",p:"Tap the word you can cut without losing meaning.",s:["We","need","to","plan","ahead","for","the","audit."],a:4,e:"Planning is always ahead. “Plan for the audit” says it.",tag:"P"},
 {type:"tap",p:"Tap the noun that hides a verb.",s:["We","made","a","decision","to","hire","two","reps."],a:3,e:"“Decision” hides “decide.” Try: We decided to hire two reps.",tag:"H"},
 {type:"type",p:"Type one word that replaces “in order to”: “We met in order to review the ad.”",acc:["to"],e:"“To” does the same job: We met to review the ad.",tag:"H"}],
[{type:"tap",p:"Tap the word that makes this a simile.",s:["The","market","moved","like","a","startled","deer."],a:3,e:"“Like” signals a comparison, which makes it a simile.",tag:"C"},
 {type:"tap",p:"Tap the word that clashes with “secret.”",s:["It","was","an","open","secret."],a:3,e:"“Open” clashes with “secret,” creating an oxymoron.",tag:"X"},
 {type:"type",p:"Type the appeal (ethos, pathos, or logos): “Nine out of ten audits found the same gap.”",acc:["logos"],e:"It uses data, so it appeals to logic: logos.",tag:"A"}],
[{type:"tap",p:"Tap the word that's wrong in formal writing.",s:["If","I","was","the","manager,","I","would","approve","it."],a:2,fix:"were",e:"An imagined situation uses the subjunctive: “If I were.”",tag:"S"},
 {type:"tap",p:"Tap the word that's wrong.",s:["The","award","went","to","my","partner","and","I."],a:7,fix:"me",e:"After “to,” use the object form. Drop “my partner and”: “went to me.”",tag:"P"},
 {type:"type",p:"Type the right past-tense verb: “Yesterday I ___ down after lunch.” (from “lie,” meaning recline)",acc:["lay"],e:"The past tense of “lie” (recline) is “lay.” Tricky, but true.",tag:"V"}],
[{type:"type",p:"Type the number of morphemes in “rethinking.”",acc:["3","three"],e:"re- + think + -ing = 3.",tag:"M"}],
[{type:"type",p:"Type the classical rhetoric term for “the opportune moment.”",acc:["kairos"],e:"Kairos is saying the right thing at the right time.",tag:"C"}]
];
export const PLACE_LV=[1,3,5,7,9];
// V5 content hooks (filled in content files below): WN = notes on why each wrong option is wrong,
// ADD = extra multiple-choice questions [prompt, options, answer index, explanation, wrong notes, skill tag],
// FIX = rewrite drills.

const mcq=(i,id,r,w,tag)=>{const x=EDIT8[id]||EDIT[id];if(x){r=x;w=x[4]}const q={id,lvl:i,type:"mc",p:r[0],o:r[1],a:r[2],e:r[3],w:w||null,tag};if(x&&x[5])q.alt=x[5];if(x&&x[6])q.ruling=x[6];return q};
export const LV=RAW.map((L,i)=>({t:L.t,l:L.l,skills:SK[i].names,q:[
  ...L.q.map((r,j)=>mcq(i,`${i}-${j}`,r,(WN[i]||[])[j],SK[i].tags[j])),
  ...EXTRA[i].map((x,j)=>({id:`${i}-x${j}`,lvl:i,...x})),
  ...(ADD[i]||[]).map((r,j)=>mcq(i,`${i}-a${j}`,r,r[4],r[5])),
  ...(FIX[i]||[]).map((x,j)=>({id:`${i}-f${j}`,lvl:i,type:"fix",scenic:true,...x})),
  ...(LAB[i]||[]).map((x,j)=>({id:`${i}-l${j}`,lvl:i,scenic:true,...x})),
  ...(MATCH[i]||[]).map((x,j)=>({id:`${i}-t${j}`,lvl:i,...x})),
  ...(MORE[i]||[]).map((x,j)=>({id:`${i}-m${j}`,lvl:i,...x})),
  ...(ADD8[i]||[]).map((x,j)=>({id:`${i}-v${j}`,lvl:i,type:"mc",...x})),
  ...MYTHS.map((x,k)=>[x,k]).filter(([x])=>x.lvl===i).map(([x,k])=>({...x,id:`${i}-y${k}`,lvl:i,type:"mor",myth:true}))]}));
export const BYID={};LV.forEach(L=>L.q.forEach(q=>{BYID[q.id]=q}));
const norm=s=>String(s==null?"":s).trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?]+$/,"");
const flat=s=>" "+String(s==null?"":s).toLowerCase().replace(/[’‘]/g,"'").replace(/[“”"]/g,"").replace(/[^a-z0-9' ]+/g," ").replace(/\s+/g," ").trim()+" ";
const has=(t,phrase)=>phrase.split("|").some(x=>t.includes(flat(x)));
// For a rewrite drill: the list of problems with a player's answer (empty = correct).
export function fixIssues(q,r){
  const t=flat(r),out=[];
  if(t.trim().length<2)return["Type your rewrite first."];
  (q.must||[]).forEach(m=>{if(!has(t,m))out.push(`Needs “${m.split("|")[0]}”${m.includes("|")?` (or ${m.split("|").slice(1).map(x=>`“${x}”`).join(", ")})`:""}.`)});
  (q.not||[]).forEach(m=>{if(has(t,m))out.push(`Drop “${m.split("|")[0]}”.`)});
  const raw=String(r==null?"":r).toLowerCase().replace(/[’‘]/g,"'").replace(/[“”]/g,'"');
  (q.rx||[]).forEach(x=>{if(!new RegExp(x.re,"i").test(raw))out.push(x.msg)});
  const n=t.trim().split(" ").length;
  if(q.max&&n>q.max)out.push(`Aim for ${q.max} words or fewer (yours has ${n}).`);
  if(q.min&&n<q.min)out.push(q.minMsg||`Your rewrite looks too short. Make it a full sentence.`);
  return out;
}
const tnorm=t=>String(t).toLowerCase().replace(/[’‘]/g,"'").replace(/\s+([,.;:?!])/g,"$1").replace(/\s+/g," ").trim();
export function orderText(q,r){return(Array.isArray(r)?r:[]).map(i=>q.tiles[i]).filter(x=>x!=null).join(q.join??" ").replace(/\s+([,.;:?!])/g,"$1")}
export function check(q,r){if(q.type==="mor")return Number(r)===q.a;if(q.type==="mc"&&q.alt&&q.alt.includes(Number(r)))return true;if(q.type==="order")return Array.isArray(r)&&q.acc.some(a=>tnorm(a)===tnorm(orderText(q,r)));if(q.type==="match")return Array.isArray(r)&&r.length===q.pairs.length&&r.every((d,i)=>d===i);if(q.type==="multi")return Array.isArray(r)&&r.length===q.a.length&&q.a.every(x=>r.includes(x));if(q.type==="type")return q.acc.some(a=>norm(a)===norm(r));if(q.type==="fix")return fixIssues(q,r).length===0;return Number(r)===q.a}
export function answerText(q){if(q.type==="mor")return q.a?"Real rule":"Myth";if(q.type==="fix")return q.model;if(q.type==="order")return q.acc[0];if(q.type==="match")return q.pairs.map(x=>`${x[0]} = ${x[1]}`).join("; ");if(q.type==="multi")return q.a.map((i,k)=>q.s[i].replace(/[.,]$/,"")+(q.fixes?` (should be “${q.fixes[k]}”)`:"")).join(", ");return q.type==="mc"?q.o[q.a]:q.type==="tap"?(q.fix?`${q.s[q.a].replace(/[.,]$/,"")} should be “${q.fix}”`:q.s[q.a].replace(/[.,]$/,"")):q.acc[0]}
// Accuracy streak: +4% per correct answer in a row (carries across rounds), up to 2x.
export const streakMult=n=>1+0.04*Math.min(Math.max((n||0)-1,0),25);
// Rewrite drills take time to type, so they get a flat bonus instead of a fading speed bonus.
export function points(level,elapsedMs,streak,type){const base=10*(level+1);const sec=elapsedMs/1000;const speed=type==="fix"?0.25:sec<1?0:Math.max(0,1-sec/20)*0.5;const mult=streakMult(streak);return Math.round(base*(1+speed)*mult)}
export const ARENA=[
{id:"a1",title:"The missed deadline",concept:"Past, present, or future",setup:"A coworker missed the monthly report deadline again. You want it on time next month.",moves:[["“You always miss this deadline.”",0,"They get defensive and list excuses. You're now arguing about the past, which can't change."],["“What would help you hit the 5th next month?”",3,"They name a bottleneck and you fix it together. Talking about the future turns blame into a choice."],["“Our team really values reliability.”",1,"They agree in general, but nothing changes. Values talk builds agreement, not action."]],lesson:"Arguments about the past assign blame. Arguments about the present affirm values. Arguments about the future decide choices. To change behavior, argue in the future tense."},
{id:"a2",title:"Five minutes with the CEO",concept:"Read the room",setup:"You get a five-minute slot to pitch a new review tool to the CEO.",moves:[["Walk through every feature and setting.",0,"The CEO checks the clock by minute two. Too much detail for this audience."],["“It cuts review time in half and lowers our risk of fines.”",3,"The CEO leans in and asks about cost. You matched the message to what this listener cares about."],["Open with three jokes to warm up the room.",1,"A laugh, then a glance at the clock. Friendly, but it spent your scarce time."]],lesson:"Fit your words to the audience and setting. The best argument for one listener can fall flat with another."},
{id:"a3",title:"Asking for a training budget",concept:"Timing",setup:"You want budget for a new training program. When do you ask?",moves:[["The same week layoffs are announced.",0,"Every new cost gets a no this week. Right request, wrong moment."],["Right after a peer firm is fined for a training gap.",3,"Leadership is already worried about the risk. The moment does half the persuading."],["At the holiday party, in passing.",1,"They say “send me something” and forget. Casual settings rarely produce decisions."]],lesson:"The same request can win or lose depending on when you make it. Look for the moment when your audience is most ready to hear it."},
{id:"a4",title:"The upset client",concept:"Concession",setup:"A client is angry that their fees went up this year.",moves:[["“The increase is in your agreement.”",0,"Technically true, and the client feels dismissed. They start shopping for another firm."],["“You're right, that's a real jump. Here's what changed, and here's what you get for it.”",3,"Their tone softens. Granting a fair point earned you the right to explain."],["“Everyone's fees went up this year.”",1,"It sounds like an excuse. They're less angry, but not convinced."]],lesson:"Conceding a fair point costs little and builds trust. People listen better once they feel heard."},
{id:"a5",title:"The new hire",concept:"Credibility",setup:"You just joined a team that doubts you know their work.",moves:[["List your degrees and past titles.",1,"They nod politely. Credentials help, but they don't prove you get this team's problems."],["Fix a small, annoying problem that's been slowing them down.",3,"Word spreads. You showed practical good sense, and you clearly care about their workload."],["“Just trust me on this.”",0,"Trust that's demanded rarely arrives. Doubt grows."]],lesson:"Credibility comes from showing good sense, good character, and goodwill toward your audience. Show it in action, not in claims."},
{id:"a6",title:"Only two choices?",concept:"Spot the fallacy",setup:"A colleague says, “Either we buy this software or we fail the audit.”",moves:[["“That's a false choice. What other options do we have?”",3,"The group lists three cheaper fixes. You named the trap without attacking anyone."],["“You're always so dramatic.”",0,"Now it's personal, and the real question gets lost. That's an attack on the person, not the point."],["“Fine, let's buy it.”",1,"Maybe it works, but you accepted a false choice without checking."]],lesson:"A false choice offers two options when more exist. Ask, “What else could we do?”"},
{id:"a7",title:"That's not what I said",concept:"Straw man",setup:"You suggest simplifying one form. Someone replies, “So you want no rules at all?”",moves:[["Restate your real point: “I'm suggesting one shorter form, with the same checks.”",3,"The room resets to your actual idea. Calm restating beats the distorted version."],["Argue that having no rules would be fine.",0,"You're now defending a position you never took."],["“That's ridiculous.”",1,"You rejected the distortion, but didn't put your real idea back on the table."]],lesson:"A straw man swaps your argument for a weaker one that's easier to knock down. Restate your real position, plainly."},
{id:"a8",title:"Friday training",concept:"Emotion with evidence",setup:"You need the team to attend an extra training session on Friday.",moves:[["“It's mandatory. Be there.”",0,"They show up, resentful and distracted. Orders get attendance, not attention."],["Share what a peer firm's fine cost the people who worked there, then the key fact: it took one missed step.",3,"The room gets quiet, then focused. Emotion made it matter, and the fact made it credible."],["“There'll be free pizza.”",1,"Attendance is up. Interest isn't."]],lesson:"Emotion moves people to act, and evidence keeps the feeling honest. The strongest appeals use both."},
{id:"a9",title:"Switching vendors",concept:"Logic",setup:"You want your manager to approve switching to a new vendor.",moves:[["“I just have a good feeling about them.”",0,"Your manager asks for something more solid. Feelings don't survive a budget review."],["Show cost and error rates for both vendors, side by side.",3,"Approved. Clear evidence made the decision easy to defend."],["“Lots of other firms use them.”",1,"Popular isn't the same as right. Your manager wants to know why it's better for you."]],lesson:"Logic means reasons and evidence your audience can check. Popularity and gut feeling are weak substitutes."},
{id:"a10",title:"The personal attack",concept:"Argue, don't fight",setup:"In a meeting, a peer says your idea is “typical of someone new.” You want the idea approved.",moves:[["Fire back about their last failed project.",0,"Now it's a fight. Everyone remembers the clash, not the idea."],["“We both want fewer errors. Can we test it for two weeks and compare?”",3,"The group agrees to a trial. You shifted from winning the exchange to winning agreement."],["Stay quiet and drop it.",1,"You kept the peace, but the idea died."]],lesson:"A fight aims to beat the other person. An argument aims to win agreement. Steer back to the goal you share."}
];
// Light Poseidon theme: the climb runs from the sea floor to Olympus.
export const PLACES=["The Sea Floor","The Kelp Forest","The Reef","The Shallows","The Shore","The Harbor","The Agora","The Hills","The Temple","Olympus"];
export const RANKS=[["Deckhand",0],["Sailor",500],["Navigator",1500],["Captain",4000],["Admiral",10000],["Triton",25000],["Poseidon",50000]];
export function rankFor(pts){let i=0;RANKS.forEach((r,k)=>{if(pts>=r[1])i=k});return{name:RANKS[i][0],min:RANKS[i][1],next:RANKS[i+1]?{name:RANKS[i+1][0],at:RANKS[i+1][1]}:null}}

// Daily Five: the same five multiple-choice questions for everyone on a given date, easy to hard.
export const DAILY_LV=[0,2,4,6,9];
const fnv=t=>{let h=2166136261;for(const c of t){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h};
export function dailyIds(date){return DAILY_LV.map(l=>{const ids=LV[l].q.filter(q=>q.type==="mc").map(q=>q.id);return ids[fnv(date+"|"+l)%ids.length]})}
