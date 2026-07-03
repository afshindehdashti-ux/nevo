
ALTER TABLE public.project_inquiries
  ADD CONSTRAINT project_inquiries_name_len CHECK (char_length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT project_inquiries_email_len CHECK (char_length(email) BETWEEN 3 AND 320),
  ADD CONSTRAINT project_inquiries_phone_len CHECK (phone IS NULL OR char_length(phone) <= 40),
  ADD CONSTRAINT project_inquiries_company_len CHECK (company IS NULL OR char_length(company) <= 200),
  ADD CONSTRAINT project_inquiries_country_len CHECK (country IS NULL OR char_length(country) <= 100),
  ADD CONSTRAINT project_inquiries_application_len CHECK (application IS NULL OR char_length(application) <= 200),
  ADD CONSTRAINT project_inquiries_message_len CHECK (message IS NULL OR char_length(message) <= 5000),
  ADD CONSTRAINT project_inquiries_source_len CHECK (source_page IS NULL OR char_length(source_page) <= 300);

ALTER TABLE public.download_events
  ADD CONSTRAINT download_events_doc_len CHECK (char_length(document_id) BETWEEN 1 AND 200),
  ADD CONSTRAINT download_events_title_len CHECK (document_title IS NULL OR char_length(document_title) <= 300),
  ADD CONSTRAINT download_events_category_len CHECK (category IS NULL OR char_length(category) <= 100),
  ADD CONSTRAINT download_events_source_len CHECK (source_page IS NULL OR char_length(source_page) <= 300);
