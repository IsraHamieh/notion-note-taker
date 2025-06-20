import ray
from processing.tasks import process_files, process_youtube_videos, process_google
from processing.langgraph_agent import run_langgraph_agent

ray.init(ignore_reinit_error=True)

def get_file_type(file_name):
    if file_name.endswith(".pdf") or file_name.endswith(".docx") or file_name.endswith(".pptx") or file_name.endswith(".xlsx"):
        return "file"
    elif file_name.contains("youtube"):
        return "youtube"
    else:
        return "unknown"
    
def process_all(files):
    futures = []
    for file in files:
        if file["type"] == "file":
            futures.append(process_files.remote(file["path"]))
        elif file["type"] == "youtube":
            futures.append(process_youtube_videos.remote(file["path"]))
    results = ray.get(futures)
    return results

def aggregate_results(results):
    # Aggregate all text content
    texts = [r["content"] for r in results if "content" in r]
    return "\n".join(texts)

if __name__ == "__main__":
    results = process_files(files_to_process)
    aggregated_text = aggregate_results(results)
    print("Aggregated text:\n", aggregated_text[:500], "...\n")
    agent_output = run_langgraph_agent(aggregated_text)
    print("LangGraph agent output:\n", agent_output) 