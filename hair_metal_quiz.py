#!/usr/bin/env python3
"""Interactive command-line hair metal fill-in-the-blank quiz."""

import random
import string
import sys

GREEN = "\033[92m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

QUESTIONS = [
    {"prompt": "Bringin' on the _______", "answer": "Heartbreak", "artist": "Def Leppard"},
    {"prompt": "Turn up the _______", "answer": "Radio", "artist": "Autograph"},
    {"prompt": "No One Like _______", "answer": "You", "artist": "Scorpions"},
    {"prompt": "High _______", "answer": "Enough", "artist": "Damn Yankees"},
    {"prompt": "Kiss Me _______", "answer": "Deadly", "artist": "Lita Ford"},
    {"prompt": "We're Not Gonna _______ It", "answer": "Take", "artist": "Twisted Sister"},
    {"prompt": "November _______", "answer": "Rain", "artist": "Guns N' Roses"},
    {"prompt": "Round and _______", "answer": "Round", "artist": "Ratt"},
    {"prompt": "Love _______", "answer": "Bites", "artist": "Def Leppard"},
    {"prompt": "Sweet _______ O' Mine", "answer": "Child", "artist": "Guns N' Roses"},
    {"prompt": "I Wanna _______", "answer": "Rock", "artist": "Twisted Sister"},
    {"prompt": "Detroit Rock _______", "answer": "City", "artist": "KISS"},
    {"prompt": "Love of a _______", "answer": "Lifetime", "artist": "Firehouse"},
    {"prompt": "Every Rose Has Its _______", "answer": "Thorn", "artist": "Poison"},
    {"prompt": "Cum on Feel the _______", "answer": "Noize", "artist": "Quiet Riot"},
    {"prompt": "Wanted Dead Or _______", "answer": "Alive", "artist": "Bon Jovi"},
    {"prompt": "Love _______", "answer": "Song", "artist": "Tesla"},
    {"prompt": "Heaven _______", "answer": "Sent", "artist": "Dokken"},
    {"prompt": "Welcome To The _______", "answer": "Jungle", "artist": "Guns N' Roses"},
    {"prompt": "When I Look Into Your _______", "answer": "Eyes", "artist": "Firehouse"},
    {"prompt": "To Hell with the _______", "answer": "Devil", "artist": "Stryper"},
    {"prompt": "_______ City", "answer": "Paradise", "artist": "Guns N' Roses"},
    {"prompt": "Mama Weer All _______ Now", "answer": "Crazee", "artist": "Quiet Riot"},
    {"prompt": "Burning Like a _______", "answer": "Flame", "artist": "Dokken"},
    {"prompt": "Rock And Roll All _______", "answer": "Nite", "artist": "KISS"},
    {"prompt": "When the Children _______", "answer": "Cry", "artist": "White Lion"},
    {"prompt": "Girls, Girls, _______", "answer": "Girls", "artist": "Mötley Crüe"},
    {"prompt": "Once Bitten Twice _______", "answer": "Shy", "artist": "Great White"},
    {"prompt": "Without _______", "answer": "You", "artist": "Mötley Crüe"},
    {"prompt": "Rock You Like A _______", "answer": "Hurricane", "artist": "Scorpions"},
    {"prompt": "Why Can't This Be _______", "answer": "Love", "artist": "Van Halen"},
    {"prompt": "Don't Know What You Got (Till It's _______)", "answer": "Gone", "artist": "Cinderella"},
    {"prompt": "Nobody's _______", "answer": "Fool", "artist": "Cinderella"},
    {"prompt": "Shout It Out _______", "answer": "Loud", "artist": "KISS"},
    {"prompt": "18 and _______", "answer": "Life", "artist": "Skid Row"},
    {"prompt": "Unskinny _______", "answer": "Bop", "artist": "Poison"},
    {"prompt": "Livin' On A _______", "answer": "Prayer", "artist": "Bon Jovi"},
    {"prompt": "Dr. _______", "answer": "Feelgood", "artist": "Mötley Crüe"},
    {"prompt": "Fly High _______", "answer": "Michelle", "artist": "Enuff Z'Nuff"},
    {"prompt": "Sister _______", "answer": "Christian", "artist": "Night Ranger"},
    {"prompt": "You Give Love A Bad _______", "answer": "Name", "artist": "Bon Jovi"},
    {"prompt": "Cherry _______", "answer": "Pie", "artist": "Warrant"},
    {"prompt": "I Was Made For _______ You", "answer": "Lovin'", "artist": "KISS"},
    {"prompt": "Get The _______ Out", "answer": "Funk", "artist": "Extreme"},
    {"prompt": "I Remember _______", "answer": "You", "artist": "Skid Row"},
    {"prompt": "Alone _______", "answer": "Again", "artist": "Dokken"},
    {"prompt": "Lay It _______", "answer": "Down", "artist": "Ratt"},
    {"prompt": "Where You Goin' _______", "answer": "Now", "artist": "Damn Yankees"},
    {"prompt": "Sentimental _______", "answer": "Street", "artist": "Night Ranger"},
    {"prompt": "Metal Health (Bang Your _______)", "answer": "Head", "artist": "Quiet Riot"},
    {"prompt": "Edge Of A Broken _______", "answer": "Heart", "artist": "Vixen"},
    {"prompt": "Just Like _______", "answer": "Paradise", "artist": "David Lee Roth"},
    {"prompt": "Cold Day in _______", "answer": "Hell", "artist": "Steeler"},
    {"prompt": "Kickstart My _______", "answer": "Heart", "artist": "Mötley Crüe"},
    {"prompt": "Never Let _______", "answer": "Go", "artist": "Kick Axe"},
    {"prompt": "Someone Like _______", "answer": "You", "artist": "Bang Tango"},
    {"prompt": "Miles _______", "answer": "Away", "artist": "Winger"},
    {"prompt": "Give It To Me _______", "answer": "Good", "artist": "Trixter"},
    {"prompt": "Naughty _______", "answer": "Naughty", "artist": "Danger Danger"},
    {"prompt": "Smooth up in _______", "answer": "Ya", "artist": "Bulletboys"},
    {"prompt": "Feel The _______", "answer": "Shake", "artist": "Jetboy"},
    {"prompt": "Rock _______", "answer": "Bottom", "artist": "House Of Lords"},
    {"prompt": "Up All _______", "answer": "Night", "artist": "Slaughter"},
    {"prompt": "Bang _______", "answer": "Bang", "artist": "Danger Danger"},
    {"prompt": "Teas'n, _______", "answer": "Pleas'n", "artist": "Dangerous Toys"},
    {"prompt": "10,000 _______ (In One)", "answer": "Lovers", "artist": "TNT"},
    {"prompt": "Soldiers Under _______", "answer": "Command", "artist": "Stryper"},
    {"prompt": "Sister of _______", "answer": "Pain", "artist": "Vince Neil"},
    {"prompt": "Prime _______", "answer": "Mover", "artist": "Zodiac Mindwarp"},
    {"prompt": "Is This _______", "answer": "Love", "artist": "Whitesnake"},
    {"prompt": "The Final _______", "answer": "Countdown", "artist": "Europe"},
    {"prompt": "Rock the _______", "answer": "Night", "artist": "Europe"},
    {"prompt": "Youth Gone _______", "answer": "Wild", "artist": "Skid Row"},
    {"prompt": "Talk Dirty To _______", "answer": "Me", "artist": "Poison"},
    {"prompt": "Nothin' But A Good _______", "answer": "Time", "artist": "Poison"},
    {"prompt": "Modern Day _______", "answer": "Cowboy", "artist": "Tesla"},
    {"prompt": "Bad _______", "answer": "Medicine", "artist": "Bon Jovi"},
    {"prompt": "Separate Ways (Worlds _______)", "answer": "Apart", "artist": "Journey"},
    {"prompt": "I Want It _______", "answer": "All", "artist": "Queen"},
    {"prompt": "Working for the _______", "answer": "Weekend", "artist": "Loverboy"},
    {"prompt": "Here I Go _______", "answer": "Again", "artist": "Whitesnake"},
    {"prompt": "Master of _______", "answer": "Puppets", "artist": "Metallica"},
    {"prompt": "Cult of _______", "answer": "Personality", "artist": "Living Colour"},
    {"prompt": "You Could Be _______", "answer": "Mine", "artist": "Guns N' Roses"},
    {"prompt": "Alien _______", "answer": "Nation", "artist": "Scorpions"},
    {"prompt": "Monkey _______", "answer": "Business", "artist": "Skid Row"},
    {"prompt": "What You Give is What You _______", "answer": "Get", "artist": "Ratt"},
    {"prompt": "Shake & _______", "answer": "Tumble", "artist": "FireHouse"},
    {"prompt": "Edison's _______", "answer": "Medicine", "artist": "Tesla"},
    {"prompt": "Ain't Talking 'Bout _______", "answer": "Love", "artist": "Van Halen"},
]


class QuitQuiz(Exception):
    """Raised when the user types 'quit' to exit early."""


def normalize(text):
    return text.strip().strip(string.punctuation + " \t\n").lower()


def ask(prompt_text):
    try:
        response = input(prompt_text)
    except EOFError:
        raise QuitQuiz()
    if response.strip().lower() == "quit":
        raise QuitQuiz()
    return response


def ask_int(prompt_text, default, minimum, maximum):
    while True:
        raw = ask(f"{prompt_text} [default {default}]: ").strip()
        if raw == "":
            return default
        try:
            value = int(raw)
        except ValueError:
            print(f"{RED}Please enter a number between {minimum} and {maximum}.{RESET}")
            continue
        if value < minimum or value > maximum:
            print(f"{RED}Please enter a number between {minimum} and {maximum}.{RESET}")
            continue
        return value


def ask_yes_no(prompt_text, default_yes):
    default_label = "Y/n" if default_yes else "y/N"
    while True:
        raw = ask(f"{prompt_text} [{default_label}]: ").strip().lower()
        if raw == "":
            return default_yes
        if raw in ("y", "yes"):
            return True
        if raw in ("n", "no"):
            return False
        print(f"{RED}Please answer y or n.{RESET}")


def show_summary(score, total_asked, wrong):
    print()
    print(f"{BOLD}===== Final Score ====={RESET}")
    print(f"{BOLD}Score: {score}/{total_asked}{RESET}")
    if total_asked > 0:
        pct = (score / total_asked) * 100
        print(f"{BOLD}Percentage: {pct:.1f}%{RESET}")
    if wrong:
        print()
        print(f"{BOLD}You missed these:{RESET}")
        for item in wrong:
            your = item["your_answer"] if item["your_answer"] else "(no answer)"
            print(
                f"  - [{item['artist']}] {item['prompt']}  "
                f"{RED}your answer: {your}{RESET}  "
                f"{GREEN}correct: {item['answer']}{RESET}"
            )
    else:
        if total_asked > 0:
            print(f"{GREEN}Perfect score! You truly are a Hair Metal God.{RESET}")


def run_quiz():
    print(f"{BOLD}🤘 Hair Metal Fill-in-the-Blank Quiz 🤘{RESET}")
    print(f"{DIM}(Type 'quit' at any prompt to exit early.){RESET}")
    print()

    total_available = len(QUESTIONS)
    try:
        count = ask_int(
            f"How many questions do you want? (1-{total_available})",
            default=total_available,
            minimum=1,
            maximum=total_available,
        )
        randomize = ask_yes_no("Randomize the order?", default_yes=True)
    except QuitQuiz:
        print("Goodbye.")
        return

    pool = list(QUESTIONS)
    if randomize:
        random.shuffle(pool)
    selected = pool[:count]

    score = 0
    wrong = []
    asked = 0

    print()
    try:
        for idx, q in enumerate(selected, start=1):
            print(f"{BOLD}Question {idx}/{count}{RESET}  {DIM}(Artist: {q['artist']}){RESET}")
            print(f"{BOLD}  {q['prompt']}{RESET}")
            user_answer = ask("Your answer: ")
            asked += 1

            if normalize(user_answer) == normalize(q["answer"]):
                score += 1
                print(f"{GREEN}✓ Correct!{RESET}")
            else:
                print(f"{RED}✗ Wrong. The answer was: {q['answer']}{RESET}")
                wrong.append({
                    "prompt": q["prompt"],
                    "answer": q["answer"],
                    "artist": q["artist"],
                    "your_answer": user_answer.strip(),
                })

            print(f"{DIM}Score: {score}/{asked}{RESET}")
            print()
    except QuitQuiz:
        print()
        print(f"{DIM}Quitting early...{RESET}")

    show_summary(score, asked, wrong)


def main():
    try:
        run_quiz()
    except KeyboardInterrupt:
        print()
        print(f"{DIM}Interrupted. Rock on.{RESET}")
        sys.exit(0)


if __name__ == "__main__":
    main()
