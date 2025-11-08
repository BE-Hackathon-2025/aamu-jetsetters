import { useState, useEffect } from 'react';
import { faqApi, type FAQCategory, type FAQItem } from '../../services/faqApi';
import './FAQModal.css';

interface FAQModalProps {
  onClose: () => void;
}

function FAQModal({ onClose }: FAQModalProps) {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await faqApi.getAllFAQs();
      setCategories(data.categories);
      if (data.categories.length > 0) {
        setSelectedCategory(data.categories[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await faqApi.searchFAQs(searchTerm);
      setSearchResults(data.results);
      setSelectedCategory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const currentCategory = categories.find((cat) => cat.id === selectedCategory);
  const displayQuestions = searchTerm.trim() ? searchResults : currentCategory?.questions || [];

  return (
    <div className="faq-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content faq-content">
        <div className="modal-header">
          <h2 className="modal-title">Frequently Asked Questions</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="faq-search">
          <input
            type="text"
            className="faq-search-input"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim()) {
                handleSearch();
              } else {
                setSearchResults([]);
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchTerm.trim() && (
            <button className="faq-clear-search" onClick={() => {
              setSearchTerm('');
              setSearchResults([]);
            }}>
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="faq-loading">Loading FAQs...</div>
        ) : error ? (
          <div className="faq-error">Error: {error}</div>
        ) : (
          <>
            {!searchTerm.trim() && (
              <div className="faq-categories">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`faq-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            )}

            {searchTerm.trim() && searchResults.length === 0 && (
              <div className="faq-no-results">No results found for "{searchTerm}"</div>
            )}

            <div className="faq-questions">
              {displayQuestions.map((item, index) => {
                const questionId = `${selectedCategory || 'search'}-${index}`;
                const isExpanded = expandedQuestions.has(questionId);

                return (
                  <div key={questionId} className="faq-item">
                    <button
                      className="faq-question"
                      onClick={() => toggleQuestion(questionId)}
                    >
                      <span>{item.question}</span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={isExpanded ? 'expanded' : ''}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="faq-answer">{item.answer}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FAQModal;

