import re
import json
import os
import gensim.downloader as api
from tqdm import tqdm


def extract(file_path):
    connections = []
    
    with open(file_path, encoding="utf8") as file:
        lines = file.readlines()
        
    temp = []
    
    for line in tqdm(lines, desc="Extracting"):
        line = line.strip()
        
        if line.startswith("NYT Connections"):
            continue
        
        if " - " in line:
            pattern = r" - (.*)"
            match = re.search(pattern, line)
            if match:
                words = match.group(1).split(", ")
                temp.extend(words)
        
        if len(temp) == 16:
            connections.append(temp)
            temp = []
                
    return connections

def word_similarity(word1, word2, model):

    word1 = word1.lower()
    word2 = word2.lower()

    try:
        similarity_score = model.similarity(word1, word2)
        return similarity_score
    except KeyError as e:
        return None


def create(word_data, model, output_dir="data"):
    os.makedirs(output_dir, exist_ok=True)
    
    valid_games = []
    game_number = 0
    
    for words in tqdm(word_data, desc="Processing"):
        matrix = []
        simil = None
        
        for target in words:
            temp = []
            for word in words:
                simil = word_similarity(target, word, model)
                if simil is None:
                    break
                temp.append(float(simil))

            if simil is None:
                break
            matrix.append(temp)

        if simil is not None:
            game_data = {
                "game_number": game_number,
                "words": words,
                "adjacency_matrix": matrix
            }
            
            filename = f"game_{game_number}.json"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'w') as f:
                json.dump(game_data, f, indent=2)
            
            valid_games.append({
                "game_number": game_number,
                "filename": filename
            })
            
            game_number += 1
    
    return valid_games


def create_games_index(valid_games, output_dir="data"):
    index_data = {
        "total_games": len(valid_games),
        "games": valid_games
    }
    
    index_filepath = os.path.join(output_dir, "games_index.json")
    with open(index_filepath, 'w') as f:
        json.dump(index_data, f, indent=2)


def clean(word_data, model):
    missing_words = set()
    
    for words in tqdm(word_data, desc="Checking"):
        for target in words:
            target = target.lower()
            try:
                similarity_score = model.similarity(target, target)
            except KeyError:
                missing_words.add(target)
    
    return missing_words


def main():
    INPUT_FILE = "extract/full_words.txt"
    OUTPUT_DIR = "data"
    
    data = extract(INPUT_FILE)
    model = api.load("fasttext-wiki-news-subwords-300")
    missing_words = clean(data, model)
    valid_games = create(data, model, OUTPUT_DIR)
    create_games_index(valid_games, OUTPUT_DIR)
    
    print(f"Processed {len(valid_games)} games")
    if missing_words:
        print(f"{len(missing_words)} words missing from vocabulary")


if __name__ == "__main__":
    main()
