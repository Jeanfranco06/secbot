from langchain_text_splitters import (
    RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter,
)


def chunk_documents(docs, doc_type: str, section_split: bool):
    """Devuelve lista de Documents fragmentados según tipo."""
    if section_split:
        headers = [("#", "h1"), ("##", "h2"), ("###", "h3")]
        md = MarkdownHeaderTextSplitter(headers_to_split_on=headers)
        chunks = []
        for d in docs:
            try:
                chunks.extend(md.split_text(d.page_content))
            except Exception:
                chunks.append(d)
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)
        return splitter.split_documents(chunks)

    if doc_type == "faq":
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=600, chunk_overlap=0,
            separators=["\n\n", "\nQ:", "\nP:", "\n"],
        )
    elif doc_type == "runbook":
        splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
    else:
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)
    return splitter.split_documents(docs)