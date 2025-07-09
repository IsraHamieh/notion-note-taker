import ray
from docling.document_converter import DocumentConverter
from pytube import YouTube
from PIL import Image
import openpyxl
import os
import logging
from typing import List, Dict, Any
from docling.utils import model_downloader
from pathlib import Path
from docling.document_converter import DocumentConverter, PdfFormatOption, WordFormatOption, ExcelFormatOption, PowerpointFormatOption, ImageFormatOption
from docling.datamodel.pipeline_options import PipelineOptions, PdfPipelineOptions
from docling.datamodel.base_models import InputFormat

logger = logging.getLogger(__name__)


# Initialize Docling DocumentConverter
# DOCLING_MODEL_PATH = '/docling-models'
# model_downloader.download_models(output_dir=Path(DOCLING_MODEL_PATH))
# artifacts_path = DOCLING_MODEL_PATH
# allowed_formats = [
#     InputFormat.XLSX,
#     InputFormat.PDF,
#     InputFormat.PPTX,
#     InputFormat.DOCX,
#     InputFormat.IMAGE  # This covers common image formats like PNG, JPG, etc.
# ]
# pipeline_options = PipelineOptions(artifacts_path=artifacts_path)
# converter = DocumentConverter(
#     allowed_formats=allowed_formats,
#     format_options={
#         InputFormat.PDF: PdfFormatOption(ocr_enabled=True, 
#                                          extract_images=True,
#                                          extract_tables=True,
#                                          pipeline_options=PdfPipelineOptions(artifacts_path=artifacts_path)),
#         InputFormat.XLSX: ExcelFormatOption(pipeline_options=pipeline_options),
#         InputFormat.PPTX: PowerpointFormatOption(pipeline_options=pipeline_options),
#         InputFormat.DOCX: WordFormatOption(pipeline_options=pipeline_options),
#         InputFormat.IMAGE: ImageFormatOption(pipeline_options=pipeline_options)
#     }
# )
converter=DocumentConverter()

@ray.remote
def process_files(file_path: str, file_type: str, use_image_content: bool = False) -> Dict[str, Any]:
    """
    Uses Docling to parse PDF, DOCX, XLSX, PPTX, and image files.
    For images, only parses if use_image_content is True. Otherwise, returns the image path for direct use.
    Returns markdown content for all supported types.
    """
    try:
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return {"type": file_type, "error": f"File not found: {file_path}"}
        if file_type == 'image':
            if use_image_content:
                try:
                    result = converter.convert(file_path)
                    markdown = result.document.export_to_markdown()
                    logger.info(f"Image file {file_path} parsed to markdown.")
                    return {"type": file_type, "content": markdown, "parsed": True}
                except Exception as e:
                    logger.error(f"Error parsing image file {file_path}: {e}")
                    return {"type": file_type, "error": str(e)}
            else:
                logger.info(f"Returning image path for {file_path} (no parsing)")
                return {"type": file_type, "image_path": file_path, "parsed": False}
        else:
            try:
                logger.info(f"Using docling now to convert")
                result = converter.convert(file_path)
                logger.info(f"Converted, using docling now to make markdown")
                markdown = result.document.export_to_markdown(None)
                logger.info(f"File {file_path} ({file_type}) parsed to markdown.")
                return {"type": file_type, "content": markdown}
            except Exception as e:
                logger.error(f"LLamaParse Error in file {file_path}: {e}")
                return {"type": file_type, "error": str(e)}
    except Exception as e:
        logger.error(f"Unexpected error in process_files: {e}")
        return {"type": file_type, "error": str(e)}
    finally:
        # Clean up file after processing
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up file: {file_path}")
        except Exception as cleanup_err:
            logger.warning(f"Failed to clean up file {file_path}: {cleanup_err}")

@ray.remote
def process_youtube_videos(youtube_urls: List[str]) -> List[Dict[str, Any]]:
    """
    Downloads and (optionally) transcribes YouTube videos. (Transcription is a stub here.)
    """
    results = []
    for url in youtube_urls:
        try:
            logger.info(f"Processing YouTube URL: {url}")
            yt = YouTube(url)
            stream = yt.streams.filter(only_audio=True).first()
            output_path = stream.download()
            # Stub: Replace with actual transcription logic
            transcript = f"Downloaded audio for {url} at {output_path} (transcription not implemented)"
            results.append({"url": url, "transcript": transcript})
            try:
                os.remove(output_path)
                logger.info(f"Cleaned up downloaded audio: {output_path}")
            except Exception as cleanup_err:
                logger.warning(f"Failed to clean up audio file {output_path}: {cleanup_err}")
        except Exception as e:
            logger.error(f"Error processing YouTube URL {url}: {e}")
            results.append({"url": url, "error": str(e)})
    return results

@ray.remote
class TranscriptionWorker:
    def transcribe(self, audio_path: str, user_id: str) -> Dict[str, Any]:
        # TODO: Implement transcription logic
        result = ""
        # Store result in DB or return
        return {"user_id": user_id, "transcription": result}
