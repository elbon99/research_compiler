from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
import httpx
from typing import Dict, List, Optional
import re
async def fetch_webpage(url: str) -> str:
    """Fetch webpage content asynchronously."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.text

def parse_html(html_content: str) -> BeautifulSoup:
    """Parse HTML content using BeautifulSoup."""
    return BeautifulSoup(html_content, 'lxml')

async def scrape_example(url: str) -> Dict[str, List[str]]:
    """Example scraper function that returns page title and all links."""
    html_content = await fetch_webpage(url)
    soup = parse_html(html_content)
    
    # Extract page title
    title = soup.title.text if soup.title else "No title found"
    
    # Extract all links
    links = [a.get('href') for a in soup.find_all('a', href=True)]
    
    return {
        "title": title,
        "links": links
    }

def search_elements(soup: BeautifulSoup, tag: str, attrs: Optional[Dict] = None) -> List:
    """Search for specific elements in the parsed HTML."""
    return soup.find_all(tag, attrs=attrs) 


def extract_urls(soup: BeautifulSoup) -> Dict[str, List[str]]:
    """
    Extract URLs from a BeautifulSoup instance based on specific patterns.
    
    The following URL types are extracted:
      - citation_main: URLs like https://arxiv.org/abs/2504.10784
      - citation_pdf:  URLs like https://arxiv.org/pdf/2504.10784
      - citation_format: URLs like https://arxiv.org/format/2504.10784
      - search:        URLs like /search/?searchtype=author&query=Walczak%2C+M (domain is optional)
      - prevnext:      URLs like /prevnext?id=2504.11419&function=next&context=cs.AI 
                       (or function=prev) where the domain is optional.
    
    Args:
        soup (BeautifulSoup): A BeautifulSoup instance of the HTML document.
    
    Returns:
        Dict[str, List[str]]: A dictionary mapping URL types to lists of matching URLs.
    """
    # Regex explanation:
    # (?:https?://[^/]+)?  -> Optionally match the scheme (http or https) and domain.
    # Then match the respective path.
    patterns = {
        "citation_main": re.compile(r"(?:https?://[^/]+)?/abs/\d+\.\d+"),
        "citation_pdf": re.compile(r"(?:https?://[^/]+)?/pdf/\d+\.\d+"),
        "citation_format": re.compile(r"(?:https?://[^/]+)?/format/\d+\.\d+"),
        "search": re.compile(r"(?:https?://[^/]+)?/search/\?[^\"' >]+"),
        "prevnext": re.compile(r"(?:https?://[^/]+)?/prevnext\?id=\d+\.\d+&function=(?:next|prev)&context=[^\"' >]+"),
    }
    
    # Initialize the dictionary with empty lists for each category.
    extracted = {key: [] for key in patterns}
    
    # Iterate over all <a> tags with an href attribute.
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        # Check each category and save the URL to the first category that matches.
        for key, pattern in patterns.items():
            if pattern.fullmatch(href):
                extracted[key].append(href)
                # A URL should only belong to one category; once matched, break.
                break
                
    return extracted

def ensure_absolute_url(url: str, domain: str) -> str:
    """
    Ensure that the given URL is absolute. If it's relative,
    prepend the provided domain.

    Args:
        url (str): The URL to check (can be relative or absolute).
        domain (str): The base URL (including scheme and domain, and possibly a path)
                      to use when the URL is relative.

    Returns:
        str: A valid absolute URL.
    """
    parsed = urlparse(url)
    if parsed.scheme and parsed.netloc:
        # URL is already absolute.
        return url
    # URL is relative; join with the provided domain.
    absolute_url = urljoin(domain, url)
    return absolute_url

# --- URL Classifier Functions ---

def is_citation_main(url: str) -> bool:
    """Return True if the URL is a citation main page URL (e.g., https://arxiv.org/abs/1234.12345)."""
    pattern = re.compile(r"(?:https?://[^/]+)?/abs/\d+\.\d+")
    return bool(pattern.fullmatch(url))

def is_citation_pdf(url: str) -> bool:
    """Return True if the URL is a citation PDF URL (e.g., https://arxiv.org/pdf/1234.12345)."""
    pattern = re.compile(r"(?:https?://[^/]+)?/pdf/\d+\.\d+")
    return bool(pattern.fullmatch(url))

def is_citation_format(url: str) -> bool:
    """Return True if the URL is a citation format URL (e.g., https://arxiv.org/format/1234.12345)."""
    pattern = re.compile(r"(?:https?://[^/]+)?/format/\d+\.\d+")
    return bool(pattern.fullmatch(url))

def is_search_url(url: str) -> bool:
    """Return True if the URL is a search URL (e.g., /search/?searchtype=author&query=Walczak%2C+M)."""
    pattern = re.compile(r"(?:https?://[^/]+)?/search/\?[^\"' >]+")
    return bool(pattern.fullmatch(url))

def is_prevnext_next(url: str) -> bool:
    """
    Return True if the URL is a 'prevnext' URL for a newer page,
    i.e., contains function=next.
    """
    pattern = re.compile(r"(?:https?://[^/]+)?/prevnext\?id=\d+\.\d+&function=next&context=[^\"' >]+")
    return bool(pattern.fullmatch(url))

def is_prevnext_prev(url: str) -> bool:
    """
    Return True if the URL is a 'prevnext' URL for a previous page,
    i.e., contains function=prev.
    """
    pattern = re.compile(r"(?:https?://[^/]+)?/prevnext\?id=\d+\.\d+&function=prev&context=[^\"' >]+")
    return bool(pattern.fullmatch(url))