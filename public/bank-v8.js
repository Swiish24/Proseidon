// V8: rules vs. choices vs. style. Every answer here matches what the major guides accept
// (Chicago Manual of Style 18th ed., AP Stylebook, Merriam-Webster, Garner, Federal Plain Language Guidelines).

// Myth or rule? cards. a: 0 = Myth, 1 = Real rule. kind: what the statement really is.
export const MYTHS = [
{lvl:7,tag:"V",p:"You should never split an infinitive, as in “to quickly review.”",a:0,kind:"Myth",e:"Merriam-Webster notes most modern usage guides allow split infinitives. Split one when it reads more naturally."},
{lvl:7,tag:"V",p:"You should never end a sentence with a preposition.",a:0,kind:"Myth",e:"Merriam-Webster calls this a 17th-century idea that usage experts have largely abandoned. “Who did you send it to?” is fine."},
{lvl:2,tag:"J",p:"You should never start a sentence with “And” or “But.”",a:0,kind:"Myth",e:"Usage guides, including Merriam-Webster's, say starting with “And” or “But” is fine. Use it for emphasis, not in every sentence."},
{lvl:4,tag:"D",p:"You should never start a sentence with “Because.”",a:0,kind:"Myth",e:"Garner calls this an odd school myth. “Because the server failed, we lost the file” is correct. Just finish the sentence."},
{lvl:1,tag:"S",p:"“They” can never refer to just one person.",a:0,kind:"Choice",e:"The Chicago Manual of Style now endorses singular “they.” AP allows it but often prefers rewording. Both are accepted."},
{lvl:2,tag:"C",p:"The comma before “and” in a list is always required.",a:0,kind:"Style",e:"It's a style choice. Chicago uses it (pens, paper, and tape). AP usually leaves it out unless it's needed for clarity."},
{lvl:2,tag:"C",p:"The comma before “and” in a list is always wrong.",a:0,kind:"Style",e:"It's a style choice, not an error. Chicago uses it. AP usually skips it but adds it when it prevents confusion."},
{lvl:5,tag:"A",p:"Passive voice is always a mistake.",a:0,kind:"Choice",e:"Prefer active voice, but passive is the right tool when the doer is unknown or unimportant: “The vault was built in 1902.”"},
{lvl:5,tag:"P",p:"Contractions don't belong in professional writing.",a:0,kind:"Choice",e:"The federal plain language guidelines recommend contractions when appropriate. Very formal documents may still avoid them."},
{lvl:5,tag:"H",p:"Long sentences are always bad writing.",a:0,kind:"Choice",e:"Joseph Williams points out a long sentence can be clear if its subjects and verbs match its characters and actions. Length alone isn't the problem."},
{lvl:5,tag:"P",p:"Formal writing should never speak to the reader as “you.”",a:0,kind:"Choice",e:"Plain language guidelines recommend addressing the reader directly. Some academic styles avoid it, so it depends on the setting."},
{lvl:1,tag:"O",p:"A verb must agree with its subject in number.",a:1,kind:"Rule",e:"Every major guide agrees: “The list is long,” not “The list are long.”"},
{lvl:2,tag:"A",p:"“It's” means “it is” or “it has.” The possessive is “its,” with no apostrophe.",a:1,kind:"Rule",e:"This one is a true rule in every guide. “The firm updated its website.”"},
{lvl:2,tag:"J",p:"In edited writing, a comma alone can't join two complete sentences.",a:1,kind:"Rule",e:"That's a comma splice. Use a period, a semicolon, or a comma plus a joining word like “but.”"},
{lvl:0,tag:"N",p:"A pronoun should point clearly to one noun.",a:1,kind:"Rule",e:"In “Sam told Lee he was late,” we can't tell who “he” is. Rewrite so the reader doesn't have to guess."},
{lvl:3,tag:"F",p:"“Affect” is usually a verb and “effect” is usually a noun.",a:1,kind:"Rule",e:"“The rule will affect sales” uses the verb. “The rule had an effect on sales” uses the noun."},
{lvl:2,tag:"P",p:"In American style, periods and commas go inside closing quotation marks.",a:1,kind:"Rule",e:"Both Chicago and AP follow this for American English. British style often does it differently."},
{lvl:0,tag:"N",p:"Use “an” before a vowel sound, as in “an hour.”",a:1,kind:"Rule",e:"The sound matters, not the letter: “an hour,” but “a user.”"},
{lvl:7,tag:"S",p:"In formal writing, an imagined situation takes “were”: “If I were you.”",a:1,kind:"Rule",e:"That's the subjunctive. “If I was you” is common in speech but not in formal writing."},
{lvl:2,tag:"P",p:"Hyphenate a two-word description before a noun when it prevents confusion, as in “small-business owner.”",a:1,kind:"Rule",e:"AP's guidance: use the hyphen when it's needed to avoid confusion. A small-business owner owns a small business."}
];

// New multiple-choice questions. alt = other accepted answers. ruling = shown as "The Oracle's ruling."
export const ADD8 = [
[],
[{p:"“Every employee should bring ___ laptop.”",o:["their","his or her","its","they're"],a:0,alt:[1],e:"Both “their” and “his or her” are accepted.",ruling:"Both answers are accepted. The Chicago Manual of Style endorses singular “they.” AP allows it but often prefers rewording, like “Employees should bring their laptops.”",w:["","","“Its” is for things, not people.","“They're” means “they are.”"],tag:"S"}],
[],[],[],
[{p:"In which sentence is passive voice the best choice?",o:["The vault was built in 1902.","The report was written by Dana.","The decision was made by our CEO.","The ball was kicked by Sam."],a:0,e:"Nobody knows or cares who built the vault, so the passive keeps the focus on the vault.",w:["","The doer is named and matters. Active is shorter: “Dana wrote the report.”","The doer is named and matters: “Our CEO made the decision.”","The doer is named: “Sam kicked the ball.”"],tag:"A"},
 {p:"Why does “Your application has been approved” work well in a letter?",o:["The reader cares about the result, not the approver","Passive voice always sounds more polished and professional","It hides who made the mistake from the reader","Business letters should never use the active voice"],a:0,e:"Passive is useful when the thing acted on matters more than the doer.",w:["","Passive isn't automatically more professional. It fits here for a specific reason.","There's no mistake being hidden.","Active voice is fine in letters, and often better."],tag:"A"},
 {p:"A sign reads: “Hard hats must be worn past this point.” Why is passive fine here?",o:["It applies to everyone, so no single doer matters","Passive voice is required on all safety signs","It makes the sign longer and more formal","The writer wants to hide who made the rule"],a:0,e:"The rule is about the hard hats and everyone who passes. Naming a doer would add nothing.",w:["","No rule requires passive on signs. “Wear a hard hat past this point” also works.","Longer isn't the goal. It fits because the doer doesn't matter.","Hiding the rule-maker isn't the point."],tag:"A"},
 {p:"Which sentence misuses the passive by hiding who is responsible?",o:["Mistakes were made in billing.","We made mistakes in billing last month.","Our team fixed every billing mistake.","I made a mistake in the billing."],a:0,e:"“Mistakes were made” avoids saying who made them. That's the passive used to dodge blame.",w:["","This is active and owns the mistake.","This is active and says who fixed it.","This is active and takes responsibility."],tag:"A"}],
[],[],[],[]
];

// Accuracy fixes from the V8 QA pass, plus Oracle's rulings for existing questions: replace the question with one that accepts every guide's answer.
export const EDIT8 = {
"2-11":["Which list is punctuated correctly?",["We need pens, paper, and tape.","We need pens, paper and tape.","We need, pens, paper, and tape.","We need pens paper, and tape."],0,"Commas separate the items in a list.",["","","No comma after “need.” The list starts right after the verb.","A comma is missing between “pens” and “paper.”"],[1],"Both answers are accepted. The comma before “and” is a style choice: Chicago uses it, AP usually leaves it out. Pick one and stay consistent."],
"4-1":["Which word starts a dependent clause?",["and","because","however","therefore"],1,"“Because” makes a clause lean on another one.",["“And” joins equal clauses.","","“However” is a transition word. It doesn't make a clause dependent.","“Therefore” is a transition word. It doesn't make a clause dependent."]],
"4-a2":["Which word turns “the deal closed” into a dependent clause?",["and","so","once","furthermore"],2,"“Once the deal closed” can't stand alone.",["“And” joins equal clauses.","“So” joins equal clauses.","","“Furthermore” adds a point. It doesn't make a clause dependent."]],
"4-3":["In “The rep who called yesterday left a message,” what is “who called yesterday”?",["Relative clause","Independent clause","Adverb clause","Prepositional phrase"],0,"It describes which rep, so it works like an adjective. That's a relative clause.",["","It can't stand alone.","It describes a person, not how, when, or why.","It has a subject and verb, so it's a clause, not a phrase."]],
"4-8":["In “I stayed late because the deadline moved,” what is “because the deadline moved”?",["Independent clause","Adverb clause","Appositive","Noun phrase"],1,"It tells why I stayed late, and it can't stand alone. That makes it an adverb (dependent) clause.",["It can't stand alone because of “because.”","","An appositive renames a noun.","It has a subject and verb, so it's a clause."]],
"4-a13":["Which sentence has a dependent clause?",["We left at noon.","We left when the rain stopped.","We left at noon and drove straight home.","After lunch, we left."],1,"“When the rain stopped” can't stand alone.",["Only one clause.","","One clause with two verbs.","“After lunch” is a phrase. It has no verb."]],
"4-a10":["Which joins “It rained. We stayed in.” with a subordinating word?",["It rained, so we stayed in.","Because it rained, we stayed in.","It rained; we stayed in.","It rained all day, and so we stayed in."],1,"“Because” is a subordinating word.",["“So” is a coordinating conjunction.","","A semicolon joins them without a word.","“And” and “so” are coordinating conjunctions."]],
"4-a21":["In “The report on the desk is mine,” what is “on the desk”?",["Relative clause","Prepositional phrase","Independent clause","Compound noun phrase"],1,"It starts with a preposition and has no verb.",["It has no verb.","","It has no verb.","It describes where the report is. It's not a noun phrase."]],
"7-12":["Which places “almost” correctly to mean she read most of the report?",["She almost read the whole report.","She read almost the whole report.","Almost she read the whole report.","She read the whole almost report."],1,"“Almost” should sit next to what it limits: almost the whole report.",["“Almost read” means she nearly read it but didn't start or finish, which isn't the point.","","“Almost” can't open the sentence this way.","“Almost” can't sit between “whole” and “report.”"]],
"7-1":["In formal writing: “I wish it ___ Friday.”",["was","is","were","be"],2,"A wish isn't real, so formal writing uses “were.” “Was” is common in speech.",["Common in speech, but formal writing uses “were” for wishes.","A wish describes something that isn't true now, so “is” doesn't fit.","","“Be” doesn't fit after “I wish it.”"]],
"9-a15":["“Did you like my presentation?” “The slides were nicely formatted.” The reply suggests the content was weak. This is:",["An implicature","A presupposition","A performative","A deictic word"],0,"An implicature is meaning that is hinted but not said.",["","A presupposition is background the statement assumes.","A performative does an act by being said.","Deictic words, like here, now, and you, depend on who speaks and when."]],
"3-6":["In formal writing: “To ___ should I send it?”",["who","whom","whose","who's"],1,"It receives the action (send it to him), so “whom.” In casual speech, many people say “who.”",["Common in speech, but formal writing uses “whom” after “to.”","","“Whose” shows ownership.","“Who's” means “who is.”"]]
};

// One-line tips from the major guides, shown on the scenic route and after misses. Key: "level|skill".
export const TIPS = {
"1|O":"Every major guide treats subject-verb agreement as a rule. Find the real subject first.",
"1|S":"Singular “they” is accepted by the Chicago Manual of Style. AP allows it but often prefers rewording.",
"2|C":"The comma before “and” in a list is a style choice: Chicago uses it, AP usually doesn't.",
"2|J":"A comma alone can't join two full sentences. Starting a sentence with “And” or “But” is fine.",
"3|P":"“Whom” is expected in formal writing. In casual speech, “who” is common.",
"5|H":"Joseph Williams: make the characters your subjects and their actions your verbs.",
"5|A":"Plain language guidelines: active voice shows who does what. Passive still works when the doer doesn't matter.",
"5|P":"Steven Pinker: unclear writing usually comes from forgetting what your reader doesn't know.",
"7|V":"Splitting an infinitive is fine. Most modern usage guides allow it."
};
