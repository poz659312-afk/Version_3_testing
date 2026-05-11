import tkinter as tk
from tkinter import font
import requests
import random
import time
import threading
import datetime
import csv

OPENROUTER_API_KEY = "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"
OPENROUTER_MODEL = "google/gemini-2.5-flash" # Reverted to correct model

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd-mzQXe4BIt6YYbqO-U7IOnjCyQ1dmY1P1k7s6vhacdfLxIw/formResponse"

FORM_MAP = {
    "demo-phone": "entry.717101430",
    "demo-gender": "entry.798394087",
    "demo-age": "entry.47830583",
    "demo-education": "entry.2083655778",
    "demo-field": "entry.619390488",
    "q1": "entry.296797076",
    "q2": "entry.261381429",
    "q3": "entry.95330015",
    "q4": "entry.134092811",
    "q5": "entry.605011309",
    "q6": "entry.965800260",
    "q7": "entry.1945943633",
    "q8": "entry.998586002",
    "q9": "entry.886929303",
    "q10": "entry.1404740189",
    "q11": "entry.791437058",
    "q12": "entry.235163170",
    "q13": "entry.1666772442",
    "q14": "entry.1886876082",
    "q15": "entry.1129077419",
    "q16": "entry.1155979803",
    "q17": "entry.671122580",
    "q18": "entry.580089303",
    "q19": "entry.2070190031",
    "q20": "entry.2104612883",
}

# Choices
CHOICES = {
    "demo-gender": ["Male", "Female"],
    "demo-age": ["16 - 19", "20 - 23", "24 or above"],
    "demo-education": ["High School", "University", "Graduated"],
    "demo-field": ["Data Science", "Engineering", "Medicine", "Business", "Arts", "Other"],
}

# Five characters specified by the user
CHARACTERS = [
    ("Ibrahim Adel", "Traffic Police Officer - Manager"),
    ("Abdelmonem Ramadan", "Emergency Ambulance Driver - Critical User"),
    ("Kinzey Mohammed", "Daily Driver 1 – End User"),
    ("Omar Ahmed", "Daily Driver 2 – End User"),
    ("Mohammed Kamel", "Employee in the Governorate"),
]

# Alexandria neighborhoods (Arabic names) to make replies look local
ALEX_NEIGHBORHOODS = [
    "محرم بك",
    "سموحة",
    "ستانلي",
    "كوم الدكة",
    "رشدي",
    "المنتزه",
    "العصافرة",
    "أبو قير",
    "بحري",
    "المحمودية",
]

def generate_random_data():
    data = {}
    
    # Rational Demographic Generation
    data[FORM_MAP["demo-gender"]] = random.choice(CHOICES["demo-gender"])
    
    # Intelligently link age and education
    age = random.choice(CHOICES["demo-age"])
    data[FORM_MAP["demo-age"]] = age
    
    if age == "16 - 19":
        # 16-19 years old are typically in High School or just starting University
        data[FORM_MAP["demo-education"]] = random.choice(["High School", "University"])
    elif age == "20 - 23":
        # 20-23 years old are usually in University or just Graduated
        data[FORM_MAP["demo-education"]] = random.choice(["University", "Graduated"])
    else: # "24 or above"
        # 24+ are overwhelmingly Graduated, maybe a few still in University
        data[FORM_MAP["demo-education"]] = random.choices(["Graduated", "University"], weights=[0.85, 0.15])[0]

    # Phone is now always empty
    # data[FORM_MAP["demo-phone"]] = phone

    # Single choice fields (exclude demographics already handled)
    single_choice_keys = ["demo-field", "q1", "q2", "q4", "q5", "q6", "q7", "q8", "q9", "q11", "q12", "q13", "q14", "q16"]
    for key in single_choice_keys:
        choice = random.choice(CHOICES[key])
        if choice == "Other":
            # Google forms requires a specific syntax for "Other" text fields instead of the literal word "Other"
            data[FORM_MAP[key]] = "__other_option__"
            data[FORM_MAP[key] + ".other_option_response"] = "Other field" 
        else:
            data[FORM_MAP[key]] = choice
        
    # Multiple choice fields (checkboxes)
    multi_choice_keys = ["q3", "q10", "q15"]
    for key in multi_choice_keys:
        num_choices = random.randint(1, 4)
        choices = random.sample(CHOICES[key], num_choices)
        
        parsed_choices = []
        has_other = False
        for c in choices:
            if c == "Other":
                has_other = True
            else:
                parsed_choices.append(c)
                
        if has_other:
            parsed_choices.append("__other_option__")
            data[FORM_MAP[key] + ".other_option_response"] = "Other tools"
            
        data[FORM_MAP[key]] = parsed_choices 

    return data


def generate_text_answer(question_prompt, persona, lang):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    prompt = (
        f"You are simulating a human taking a short traffic survey. Persona: {persona}.\n"
        f"Answer naturally and casually as that persona. Use {lang} only. Make it human: sometimes miss punctuation, use short slang or colloquial phrases, and keep it 1–3 short lines.\n"
        f"Do NOT say you're an AI. Avoid formal or perfect grammar — sound like a real quick human reply.\n"
        f"Question: {question_prompt}"
    )

    payload = {
        "model": OPENROUTER_MODEL,
        "max_tokens": 150, # Critical fix for low credits
        "messages": [
            {"role": "system", "content": f"You are a human respondent in a survey about AI impact. You express real opinions and feelings. Do not reveal you are an AI. You must reply in {lang} only."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.8 # Higher temp for more creative, varied responses
    }

    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        res_json = response.json()
        return res_json['choices'][0]['message']['content'].strip()
    except requests.exceptions.HTTPError as e:
        err_info = response.text if response else ""
        return f"OpenRouter API Error {response.status_code}: {err_info}"
    except Exception as e:
        return f"Request Failed: {str(e)}"

# Colors inspired by modern web UI
BG_COLOR = "#0f172a"          # Slate 900
PANEL_COLOR = "#1e293b"       # Slate 800
TEXT_COLOR = "#f8fafc"        # Slate 50
ACCENT_1 = "#8b5cf6"          # Violet 500
ACCENT_2 = "#ec4899"          # Pink 500
BTN_HOVER = "#a78bfa"         # Violet 400
SUCCESS_COLOR = "#10b981"     # Emerald 500

class AutoSubmitterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Survey Auto Submitter Pro")
        self.root.geometry("650x800")
        self.root.configure(bg=BG_COLOR)
        
        self.custom_font = font.Font(family="Segoe UI", size=10)
        self.title_font = font.Font(family="Segoe UI", size=14, weight="bold")
        
        self.text_vars = {
            "q17": tk.StringVar(),
            "q18": tk.StringVar(),
            "q19": tk.StringVar(),
            "q20": tk.StringVar()
        }
        
        self.countdown_time = 0
        self.current_random_choices = {}
        self.create_widgets()
        
    def create_widgets(self):
        # Main container simulating a web card
        self.main_frame = tk.Frame(self.root, bg=PANEL_COLOR, bd=0, highlightthickness=0)
        self.main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        title_lbl = tk.Label(self.main_frame, text="✨ AI Form Submitter ✨", font=self.title_font, bg=PANEL_COLOR, fg=ACCENT_2)
        title_lbl.pack(pady=(10,20))

        fields = [
            ("Q17: Qualities human writing has that AI lacks?", "q17"),
            ("Q18: Disadvantages of AI writing?", "q18"),
            ("Q19: Main advantages of AI writing?", "q19"),
            ("Q20: Additional comments?", "q20")
        ]

        self.entries = {}
        for label_text, key in fields:
            lbl = tk.Label(self.main_frame, text=label_text, bg=PANEL_COLOR, fg=ACCENT_1, font=self.custom_font)
            lbl.pack(anchor=tk.W, padx=15, pady=(5, 2))
            
            entry = tk.Entry(self.main_frame, textvariable=self.text_vars[key], font=self.custom_font, 
                             bg="#334155", fg=TEXT_COLOR, insertbackground=TEXT_COLOR, relief=tk.FLAT)
            entry.pack(fill=tk.X, padx=15, pady=(0, 10), ipady=5)
            self.entries[key] = entry

        # Button row
        btn_frame = tk.Frame(self.main_frame, bg=PANEL_COLOR)
        btn_frame.pack(fill=tk.X, padx=15, pady=15)

        self.btn_gen = tk.Button(btn_frame, text="🧠 Generate AI Answers & Choices", command=self.generate_answers, 
                                 bg=ACCENT_1, fg="white", font=self.custom_font, relief=tk.FLAT, activebackground=BTN_HOVER, activeforeground="white", cursor="hand2")
        self.btn_gen.pack(side=tk.LEFT, padx=(0,10), ipadx=10, ipady=5)

        self.btn_submit = tk.Button(btn_frame, text="🚀 Submit Details", command=self.start_submission, 
                                    bg=ACCENT_2, fg="white", font=self.custom_font, relief=tk.FLAT, activebackground="#f472b6", activeforeground="white", cursor="hand2")
        self.btn_submit.pack(side=tk.LEFT, ipadx=10, ipady=5)
        
        # New: generate character-specific responses and save
        self.btn_char = tk.Button(btn_frame, text="📝 Generate & Save Character Responses", command=self.generate_and_save_character_responses,
                      bg="#06b6d4", fg="white", font=self.custom_font, relief=tk.FLAT, activebackground="#0ea5b4", cursor="hand2")
        self.btn_char.pack(side=tk.LEFT, padx=(10,0), ipadx=8, ipady=5)
        
        self.status_var = tk.StringVar(value="Status: Ready to Generate!")
        self.status_lbl = tk.Label(self.main_frame, textvariable=self.status_var, font=self.custom_font, bg=PANEL_COLOR, fg=TEXT_COLOR)
        self.status_lbl.pack(anchor=tk.W, padx=15, pady=10)

        # Log visual box
        self.log_text = tk.Text(self.main_frame, height=12, bg="#0f172a", fg="#38bdf8", font=("Consolas", 9), relief=tk.FLAT, bd=10)
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=15, pady=(0, 15))

    def log(self, message):
        self.log_text.insert(tk.END, f"> {message}\n")
        self.log_text.see(tk.END)
        self.root.update_idletasks()

    def generate_answers(self):
        self.btn_gen.config(state=tk.DISABLED)
        self.status_var.set("Status: Generating choices and querying OpenRouter AI...")
        self.status_lbl.config(fg="#fbbf24") # Yellow/warning colored status
        
        # Randomize the radio/checkbox choices so the user can see them
        self.current_random_choices = generate_random_data()
        self.log("--- GENERATED DEMOGRAPHICS & CHOICES ---")
        
        # Inverse mapping to show human-readable keys
        inverse_map = {v: k for k, v in FORM_MAP.items()}
        for entry_key, ans in self.current_random_choices.items():
            question_id = inverse_map.get(entry_key, entry_key)
            self.log(f"{question_id}: {ans}")
            
        self.log("----------------------------------------")
        
        personas = [
            "20-year-old engineering student who is skeptical of AI", 
            "25-year-old artist who values human touch but uses AI for ideas", 
            "18-year-old high school student who uses AI daily for homework",
            "An analytical 24-year-old data science grad",
            "Creative writer who finds AI repetitive",
            "A normal internet user just filling out a survey quickly"
        ]

        def worker():
            persona = random.choice(personas)
            # Pick ONE language to use for all questions in this submission session
            consistent_lang = random.choice(["Egyptian Arabic", "English"])
            
            self.log(f"Selected random persona: {persona}")
            self.log(f"Selected language: {consistent_lang}")
            
            prompts = {
                "q17": "What qualities does human writing have that AI lacks?",
                "q18": "Do you think AI writing has disadvantages? If yes, mention them.",
                "q19": "What are the main advantages of AI writing?",
                "q20": "Any additional comments? (Reply casually, or say nothing much)"
            }
            
            for key, prompt in prompts.items():
                self.log(f"Thinking for {key}...")
                ans = generate_text_answer(prompt, persona, consistent_lang)
                self.text_vars[key].set(ans)
                if "Error" in ans or "Failed" in ans:
                    self.log(f"API Issue on {key}: {ans}")
                else:
                    self.log(f"Generated: {ans}")
            
            def on_finished():
                self.status_var.set("Status: Generation complete. You can edit above.")
                self.status_lbl.config(fg=SUCCESS_COLOR)
                self.btn_gen.config(state=tk.NORMAL)
            self.root.after(0, on_finished)
            
        threading.Thread(target=worker, daemon=True).start()

    def generate_and_save_character_responses(self):
        self.set_status("Generating character responses...", "#fbbf24")
        self.log("Starting generation for all characters...")
        self.btn_gen.config(state=tk.DISABLED)

        def worker():
            rows = []
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            questions = {
                "BP": "Are the traffic lights appropriate?",
                "OE": "Which road has the most problems?",
                "CL": "How long do you wait at the traffic light?",
                "PQ": "During peak hours, do you think the congestion is caused more by the 'volume of cars' or 'poor timing of the traffic lights'?"
                
            }

            for name, role in CHARACTERS:
                neighborhood = random.choice(ALEX_NEIGHBORHOODS)
                persona = f"{name} ({role}) من {neighborhood}, اسكندرية"
                self.log(f"Generating answers for {persona}")
                bp = generate_text_answer(questions['BP'], persona, "Egyptian Arabic")
                oe = generate_text_answer(questions['OE'], persona, "Egyptian Arabic")
                cl = generate_text_answer(questions['CL'], persona, "Egyptian Arabic")
                pq = generate_text_answer(questions['PQ'], persona, "Egyptian Arabic")
                rows.append({"Character": name, "Role": role, "Location": neighborhood, "BP": bp, "OE": oe, "CL": cl, "PQ": pq})
                self.log(f"{name} (@{neighborhood}) -> BP: {bp} | PQ: {pq}")
                time.sleep(0.6)

            # Try saving as Excel using pandas, fallback to CSV
            xlsx_name = f"character_responses_{ts}.xlsx"
            try:
                import pandas as pd
                df = pd.DataFrame(rows)
                df.to_excel(xlsx_name, index=False)
                self.log(f"Saved Excel: {xlsx_name}")
                self.root.after(0, lambda: self.set_status(f"Saved: {xlsx_name}", SUCCESS_COLOR))
            except Exception as e:
                csv_name = f"character_responses_{ts}.csv"
                try:
                    with open(csv_name, 'w', newline='', encoding='utf-8') as f:
                        writer = csv.DictWriter(f, fieldnames=["Character", "Role", "Location", "BP", "OE", "CL", "PQ"]) 
                        writer.writeheader()
                        for r in rows:
                            writer.writerow(r)
                    self.log(f"Pandas unavailable or save failed ({str(e)}). Wrote CSV: {csv_name}")
                    self.root.after(0, lambda: self.set_status(f"Saved CSV: {csv_name}", SUCCESS_COLOR))
                except Exception as e2:
                    self.log(f"Failed to save responses: {str(e2)}")
                    self.root.after(0, lambda: self.set_status("Status: Failed to save", "#ef4444"))

            self.btn_gen.config(state=tk.NORMAL)

        threading.Thread(target=worker, daemon=True).start()

    def start_submission(self):
        self.btn_submit.config(state=tk.DISABLED)
        self.countdown_time = random.randint(10, 120)  # Random time between 10 seconds and 2 minutes
        
        self.log(f"Simulation delay chosen: {self.countdown_time} seconds (makes it look like you are taking time to read and submit)")
        
        def worker():
            while self.countdown_time > 0:
                self.root.after(0, lambda t=self.countdown_time: self.set_status(f"Submitting in {t}s...", "#fbbf24"))
                time.sleep(1)
                self.countdown_time -= 1
                
            self.root.after(0, lambda: self.set_status("Compiling and sending...", "#38bdf8"))
            
            # Use the choices we generated. If user clicked submit before generate, generate them now.
            if not self.current_random_choices:
                self.current_random_choices = generate_random_data()
                
            form_data = self.current_random_choices.copy()
            
            # Map text answers
            form_data[FORM_MAP["q17"]] = self.text_vars["q17"].get()
            form_data[FORM_MAP["q18"]] = self.text_vars["q18"].get()
            form_data[FORM_MAP["q19"]] = self.text_vars["q19"].get()
            form_data[FORM_MAP["q20"]] = self.text_vars["q20"].get()

            # For checkboxes, Google Forms can be extremely picky if sending multiple of the same key
            # but standard x-www-form-urlencoded works natively over loops
            payload = []
            for k, v in form_data.items():
                if isinstance(v, list):
                    for item in v:
                        payload.append((k, item))
                else:
                    payload.append((k, v))
            
            # Additional hidden fields Google forms sometimes require
            payload.append(("fvv", "1"))
            payload.append(("pageHistory", "0,1,2"))
            
            self.log("Sending payload to Google Form...")
            try:
                # Disable following redirects to catch the actual 200/302 from google forms
                res = requests.post(FORM_URL, data=payload, allow_redirects=False)
                # Any 2xx or 3xx (like 302 Found redirect back) response from google forms is success
                if str(res.status_code).startswith('2') or str(res.status_code).startswith('3'):
                    self.log("✅ Successfully submitted!")
                    self.root.after(0, lambda: self.set_status("Status: Submitted Successfully!", SUCCESS_COLOR))
                    self.root.after(0, self.clear_texts)
                    self.current_random_choices = {} # clear so next run gets fresh choices
                else:
                    self.log(f"❌ Failed. Status {res.status_code}")
                    self.log(f"Server response: {res.text[:200]}")
                    self.root.after(0, lambda: self.set_status(f"Status: Error {res.status_code}", "#ef4444"))
            except Exception as e:
                self.log(f"❌ Exception during submit: {str(e)}")
                self.root.after(0, lambda: self.set_status("Status: Exception occurred", "#ef4444"))

            self.root.after(0, lambda: self.btn_submit.config(state=tk.NORMAL))

        threading.Thread(target=worker, daemon=True).start()
    
    def set_status(self, message, color):
        self.status_var.set(message)
        self.status_lbl.config(fg=color)
        
    def clear_texts(self):
        for key in self.text_vars:
            self.text_vars[key].set("")


if __name__ == "__main__":
    root = tk.Tk()
    app = AutoSubmitterApp(root)
    root.mainloop()
