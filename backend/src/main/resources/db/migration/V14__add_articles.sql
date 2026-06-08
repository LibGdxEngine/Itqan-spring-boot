CREATE TABLE articles (
    id                     BIGSERIAL    PRIMARY KEY,
    title                  VARCHAR(512) NOT NULL,
    slug                   VARCHAR(512) NOT NULL UNIQUE,
    description            VARCHAR(2000),
    content                TEXT         NOT NULL,
    cover_image_url        TEXT,
    cover_image_object_key VARCHAR(512),
    reading_time_minutes   INT,
    published              BOOLEAN      NOT NULL DEFAULT FALSE,
    author_user_id         BIGINT,
    author_name            VARCHAR(255),
    category               VARCHAR(128),
    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    published_at           TIMESTAMP
);

CREATE INDEX idx_articles_slug                 ON articles (slug);
CREATE INDEX idx_articles_published            ON articles (published);
CREATE INDEX idx_articles_author_user_id       ON articles (author_user_id);
CREATE INDEX idx_articles_published_published_at ON articles (published, published_at DESC);

CREATE TABLE landing_page_featured_articles (
    landing_page_id BIGINT NOT NULL,
    article_id      BIGINT NOT NULL,
    position        INT    NOT NULL,
    PRIMARY KEY (landing_page_id, position)
);
