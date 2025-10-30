--
-- PostgreSQL database dump
--

\restrict 4AnUhOWWpqZOpz1hY3r86UveKtMSOdof2poaehUlaTAnAPCJAuZ4zHCgTt2zHBe

-- Dumped from database version 13.22 (Debian 13.22-1.pgdg13+1)
-- Dumped by pg_dump version 13.22 (Debian 13.22-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    title text,
    category text,
    vendor_id text,
    vendor text,
    price double precision,
    cost double precision,
    moq integer,
    qty integer,
    upc text,
    asin text,
    lead_time text,
    exp_date text,
    fob text,
    image_url text,
    out_of_stock boolean DEFAULT false,
    amazon_url text,
    walmart_url text,
    ebay_url text,
    offer_date timestamp without time zone,
    last_sent timestamp without time zone,
    sales_per_month integer,
    net double precision,
    date_added timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, title, category, vendor_id, vendor, price, cost, moq, qty, upc, asin, lead_time, exp_date, fob, image_url, out_of_stock, amazon_url, walmart_url, ebay_url, offer_date, last_sent, sales_per_month, net, date_added) FROM stdin;
\.


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 1, false);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 4AnUhOWWpqZOpz1hY3r86UveKtMSOdof2poaehUlaTAnAPCJAuZ4zHCgTt2zHBe

