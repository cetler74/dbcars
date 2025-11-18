--
-- PostgreSQL database dump
--

\restrict H5bL5yaE30vxyiqtvg4k6KieHzWbFgGRyeEGOmgBIlo6OIczdThHKir3cyAjhVv

-- Dumped from database version 18.0 (Postgres.app)
-- Dumped by pg_dump version 18.0 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: availability_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability_notes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_id uuid,
    vehicle_subunit_id uuid,
    note_date date NOT NULL,
    note text NOT NULL,
    note_type character varying(50) DEFAULT 'maintenance'::character varying,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.availability_notes OWNER TO postgres;

--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: tiagocordeiro
--

CREATE TABLE public.blog_posts (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    excerpt text,
    featured_image character varying(500),
    is_published boolean DEFAULT false,
    author_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cover_image character varying(500),
    hero_image character varying(500)
);


ALTER TABLE public.blog_posts OWNER TO tiagocordeiro;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: tiagocordeiro
--

CREATE SEQUENCE public.blog_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_posts_id_seq OWNER TO tiagocordeiro;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tiagocordeiro
--

ALTER SEQUENCE public.blog_posts_id_seq OWNED BY public.blog_posts.id;


--
-- Name: booking_extras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_extras (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    extra_id uuid NOT NULL,
    quantity integer DEFAULT 1,
    price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.booking_extras OWNER TO postgres;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_number character varying(50) NOT NULL,
    customer_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    vehicle_subunit_id uuid,
    pickup_location_id uuid NOT NULL,
    dropoff_location_id uuid NOT NULL,
    pickup_date timestamp without time zone NOT NULL,
    dropoff_date timestamp without time zone NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    total_price numeric(10,2) NOT NULL,
    base_price numeric(10,2) NOT NULL,
    extras_price numeric(10,2) DEFAULT 0,
    discount_amount numeric(10,2) DEFAULT 0,
    coupon_code character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_link text
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    minimum_rental_days integer,
    minimum_amount numeric(10,2),
    valid_from date NOT NULL,
    valid_until date NOT NULL,
    usage_limit integer,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    date_of_birth date,
    license_number character varying(100),
    license_country character varying(100),
    license_expiry date,
    address text,
    city character varying(100),
    country character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_blacklisted boolean DEFAULT false,
    blacklist_reason text
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: damage_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.damage_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_subunit_id uuid NOT NULL,
    booking_id uuid,
    damage_description text NOT NULL,
    damage_location character varying(255),
    repair_cost numeric(10,2),
    images text[],
    reported_by uuid,
    reported_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    repaired_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.damage_logs OWNER TO postgres;

--
-- Name: extras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extras (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    price_type character varying(20) DEFAULT 'per_rental'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cover_image character varying(500)
);


ALTER TABLE public.extras OWNER TO postgres;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    country character varying(100) DEFAULT 'Morocco'::character varying,
    phone character varying(50),
    email character varying(255),
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: pricing_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pricing_plans OWNER TO postgres;

--
-- Name: pricing_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_id uuid,
    pricing_plan_id uuid,
    start_date date NOT NULL,
    end_date date NOT NULL,
    location_id uuid,
    daily_price numeric(10,2),
    weekly_price numeric(10,2),
    monthly_price numeric(10,2),
    hourly_price numeric(10,2),
    multiplier numeric(5,2) DEFAULT 1.0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pricing_rules OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'admin'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vehicle_extras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_extras (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_id uuid NOT NULL,
    extra_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vehicle_extras OWNER TO postgres;

--
-- Name: vehicle_subunits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_subunits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_id uuid NOT NULL,
    license_plate character varying(50) NOT NULL,
    vin character varying(50),
    status character varying(50) DEFAULT 'available'::character varying,
    current_location_id uuid,
    mileage integer DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vehicle_subunits OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    make character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    year integer NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    seats integer DEFAULT 4,
    transmission character varying(20) DEFAULT 'automatic'::character varying,
    fuel_type character varying(20) DEFAULT 'gasoline'::character varying,
    features text[],
    images text[],
    base_price_daily numeric(10,2) NOT NULL,
    base_price_weekly numeric(10,2),
    base_price_monthly numeric(10,2),
    base_price_hourly numeric(10,2),
    minimum_rental_days integer DEFAULT 1,
    minimum_age integer DEFAULT 25,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    color character varying(50)
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: blog_posts id; Type: DEFAULT; Schema: public; Owner: tiagocordeiro
--

ALTER TABLE ONLY public.blog_posts ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_id_seq'::regclass);


--
-- Data for Name: availability_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability_notes (id, vehicle_id, vehicle_subunit_id, note_date, note, note_type, created_by, created_at, updated_at) FROM stdin;
02ed554f-ada0-43d1-b09c-d0487af4e372	873ec648-2c50-418d-a64a-66f0d43a125c	\N	2026-01-30	 	maintenance	440838a8-8af5-40df-b873-f9a5288999f9	2025-11-16 17:53:41.95684	2025-11-16 17:53:41.95684
2d526c56-e137-433d-9729-10e8f3feb003	0db25e9b-cc7b-451a-8bf5-71762743eabb	\N	2025-11-19	special	blocked	440838a8-8af5-40df-b873-f9a5288999f9	2025-11-17 03:00:11.692515	2025-11-17 03:00:11.692515
adf5e9ee-c017-45ff-a3ec-a252c20b8cb9	c9f994d8-d4c1-45ef-9967-c995dec4bb98	\N	2025-11-17	s	maintenance	440838a8-8af5-40df-b873-f9a5288999f9	2025-11-17 04:41:09.54359	2025-11-17 04:41:09.54359
616a989c-f032-4fa2-8515-9a0d99be519f	c9f994d8-d4c1-45ef-9967-c995dec4bb98	\N	2025-11-18	s	maintenance	440838a8-8af5-40df-b873-f9a5288999f9	2025-11-17 04:41:09.545961	2025-11-17 04:41:09.545961
5ac1b479-9e29-4643-b4a8-dd63d6cd7239	c9f994d8-d4c1-45ef-9967-c995dec4bb98	\N	2025-11-20	s	maintenance	440838a8-8af5-40df-b873-f9a5288999f9	2025-11-17 04:41:09.630742	2025-11-17 04:41:09.630742
9d93da86-4f27-4422-a8e5-c64e6173a548	c9f994d8-d4c1-45ef-9967-c995dec4bb98	\N	2025-11-19	s	maintenance	440838a8-8af5-40df-b873-f9a5288999f9	2025-11-17 04:41:09.630768	2025-11-17 04:41:09.630768
d65f3114-a547-45f8-9873-a3cc5d31c35b	c9f994d8-d4c1-45ef-9967-c995dec4bb98	\N	2025-11-21	s	maintenance	440838a8-8af5-40df-b873-f9a5288999f9	2025-11-17 04:41:09.632516	2025-11-17 04:41:09.632516
4dae6b2a-e6cf-4333-b6bd-01d1291cc272	c9f994d8-d4c1-45ef-9967-c995dec4bb98	\N	2025-11-22	s	maintenance	440838a8-8af5-40df-b873-f9a5288999f9	2025-11-17 04:41:09.635024	2025-11-17 04:41:09.635024
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: tiagocordeiro
--

COPY public.blog_posts (id, title, content, excerpt, featured_image, is_published, author_id, created_at, updated_at, cover_image, hero_image) FROM stdin;
1	hthtrhrt	trtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshtstrtrhtrhrthtrshstrhtrhtrhtrshthtshshts	htrhtrhtr	http://localhost:3001/uploads/vehicles/Screenshot 2025-11-15 at 02.59.51-1763217360448-600064614.png	t	440838a8-8af5-40df-b873-f9a5288999f9	2025-11-15 14:36:05.00399	2025-11-16 02:36:21.935402	http://localhost:3001/uploads/vehicles/Screenshot 2025-11-15 at 02.59.51-1763217360448-600064614.png	http://localhost:3001/uploads/vehicles/Screenshot 2025-11-15 at 02.18.25-1763221276294-177080021.png
\.


--
-- Data for Name: booking_extras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_extras (id, booking_id, extra_id, quantity, price, created_at) FROM stdin;
b28ff399-eb3d-48f7-8cd2-d2f242a3a2ba	001be67e-9b6b-4ccd-8a1c-b4c6b01ee3fc	97e369c1-8f12-40a1-a1ae-53e5cab864ea	1	30.00	2025-11-16 00:34:50.603946
72e00e5a-4ed6-4145-b240-8a6af7e9961b	001be67e-9b6b-4ccd-8a1c-b4c6b01ee3fc	4ed580a0-2a84-4148-886c-6db5f23f05ed	1	10.00	2025-11-16 00:34:50.604982
94075ee7-f680-4851-8598-38b700c06877	da1a1855-77c1-4889-9364-0e28ed3b485a	9990fc73-a088-4edd-b2a4-a42995c61c51	1	50.00	2025-11-16 00:37:13.795859
fdf5bd21-ac51-4c02-a4d7-57492dc99200	da1a1855-77c1-4889-9364-0e28ed3b485a	3476559c-695c-4692-b601-abc77d3c9083	1	15.00	2025-11-16 00:37:13.797448
9de51507-a2b3-471a-b64d-43dbffbbb960	da1a1855-77c1-4889-9364-0e28ed3b485a	7b8542fc-983a-4ff0-b47c-731e64f2c003	1	75.00	2025-11-16 00:37:13.798598
9c65add2-70a5-4b4c-8a5f-7e96e13ed1d5	ab1afba7-8287-482e-bc0a-7d77f6e07b71	459dc035-6c86-46c7-a330-63fd10ad0d73	1	25.00	2025-11-16 00:54:30.073178
c6abed3a-9bb0-4f2f-81c5-76be65919f90	ab1afba7-8287-482e-bc0a-7d77f6e07b71	7b8542fc-983a-4ff0-b47c-731e64f2c003	1	75.00	2025-11-16 00:54:30.07421
8965b559-c3b8-4298-8cb2-5ff2f6f8c77e	ab1afba7-8287-482e-bc0a-7d77f6e07b71	3476559c-695c-4692-b601-abc77d3c9083	1	15.00	2025-11-16 00:54:30.07472
a665efef-bb82-495d-8f08-377c9d577ce5	73bf00c6-9775-4d77-acc7-c5e45693a8fa	459dc035-6c86-46c7-a330-63fd10ad0d73	1	25.00	2025-11-16 02:33:20.985158
27090383-b4b2-4d92-a738-ce0c110ef77c	73bf00c6-9775-4d77-acc7-c5e45693a8fa	7b8542fc-983a-4ff0-b47c-731e64f2c003	1	75.00	2025-11-16 02:33:20.986712
1f94c469-0115-44f9-b8f9-db1ffec968a6	232de9f3-a8ee-4bf2-a4e4-b55b1be093eb	459dc035-6c86-46c7-a330-63fd10ad0d73	1	25.00	2025-11-16 17:02:27.793229
f9d21f49-b829-4eb9-90bc-3d2938de428a	232de9f3-a8ee-4bf2-a4e4-b55b1be093eb	7b8542fc-983a-4ff0-b47c-731e64f2c003	1	75.00	2025-11-16 17:02:27.794364
ee364ead-55f1-432c-9e1a-860c12c2a485	232de9f3-a8ee-4bf2-a4e4-b55b1be093eb	3476559c-695c-4692-b601-abc77d3c9083	1	15.00	2025-11-16 17:02:27.79488
a8f28646-f220-4c88-8a2a-15fe29ed6b67	662fd34f-2104-43fc-adcb-3ce28d3c0169	459dc035-6c86-46c7-a330-63fd10ad0d73	1	25.00	2025-11-16 17:06:59.720408
6469bbd7-3e25-428d-998d-465fd6804d90	662fd34f-2104-43fc-adcb-3ce28d3c0169	7b8542fc-983a-4ff0-b47c-731e64f2c003	1	75.00	2025-11-16 17:06:59.721592
5e0be2d5-acae-4f3e-8abf-394c6de7b7b7	662fd34f-2104-43fc-adcb-3ce28d3c0169	3476559c-695c-4692-b601-abc77d3c9083	1	15.00	2025-11-16 17:06:59.722254
3cdc1c54-acd3-4130-b898-fc2e8372f0e6	662fd34f-2104-43fc-adcb-3ce28d3c0169	9990fc73-a088-4edd-b2a4-a42995c61c51	1	50.00	2025-11-16 17:06:59.722824
ebefd349-d907-48b4-9fb2-c13c793e1291	00ccc604-1b53-477e-9b54-3798bc159559	4ed580a0-2a84-4148-886c-6db5f23f05ed	1	10.00	2025-11-16 18:44:46.485466
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, booking_number, customer_id, vehicle_id, vehicle_subunit_id, pickup_location_id, dropoff_location_id, pickup_date, dropoff_date, status, total_price, base_price, extras_price, discount_amount, coupon_code, notes, created_at, updated_at, payment_link) FROM stdin;
001be67e-9b6b-4ccd-8a1c-b4c6b01ee3fc	DB-1763253290601-1LPF1	aad1e462-3e3a-4929-aad5-c50b8eae6465	0db25e9b-cc7b-451a-8bf5-71762743eabb	516e2599-c97f-422e-84b4-f1728c67cca5	8ab8b1a9-f481-4b54-b2ae-c20f42d75bee	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	2025-11-19 00:00:00	2025-12-06 00:00:00	cancelled	1145.00	1105.00	40.00	0.00	\N	gewgewgewrew	2025-11-16 00:34:50.602109	2025-11-16 17:10:44.994675	\N
da1a1855-77c1-4889-9364-0e28ed3b485a	DB-1763253433793-LX2NZ	ee234ab2-d6b3-46b6-a02a-372438fb9923	873ec648-2c50-418d-a64a-66f0d43a125c	fd15cf94-0728-44a7-b8ea-94fb2463934b	8ab8b1a9-f481-4b54-b2ae-c20f42d75bee	8ab8b1a9-f481-4b54-b2ae-c20f42d75bee	2025-11-19 00:00:00	2025-12-06 00:00:00	cancelled	2300.00	1360.00	940.00	0.00	\N	gdsdsggdsgds	2025-11-16 00:37:13.79331	2025-11-16 17:10:53.120518	\N
662fd34f-2104-43fc-adcb-3ce28d3c0169	DB-1763312819717-I7OXJ	f5bf3ad3-f289-411b-b2e7-a6756c8cfadb	873ec648-2c50-418d-a64a-66f0d43a125c	fd15cf94-0728-44a7-b8ea-94fb2463934b	c7949da9-edb3-4321-9566-0dcf47a03a4f	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	2026-04-16 00:00:00	2026-05-30 00:00:00	confirmed	5835.00	3520.00	2315.00	0.00	\N	\N	2025-11-16 17:06:59.717831	2025-11-16 17:23:48.462194	https://web.whatsapp.com/
00ccc604-1b53-477e-9b54-3798bc159559	DB-1763318686480-BZGG8	baae285b-658f-4104-b7be-28c81e608932	2081fb3e-61d2-4737-b1dc-3521f0b65c2a	5bf8bcd0-c2ab-42b2-a994-67984f76fa1f	8ab8b1a9-f481-4b54-b2ae-c20f42d75bee	8ab8b1a9-f481-4b54-b2ae-c20f42d75bee	2025-11-29 00:00:00	2025-12-06 00:00:00	confirmed	535.00	525.00	10.00	0.00	\N	\N	2025-11-16 18:44:46.480798	2025-11-16 22:32:07.630069	https://web.whatsapp.com/
232de9f3-a8ee-4bf2-a4e4-b55b1be093eb	DB-1763312547789-W0UO7	2697d1cb-72e8-45ea-a9ff-1aa7eb8715c1	873ec648-2c50-418d-a64a-66f0d43a125c	fd15cf94-0728-44a7-b8ea-94fb2463934b	c7949da9-edb3-4321-9566-0dcf47a03a4f	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	2026-01-08 00:00:00	2026-02-20 00:00:00	confirmed	3555.00	3440.00	115.00	0.00	\N	\N	2025-11-16 17:02:27.790196	2025-11-16 22:32:17.242898	https://web.whatsapp.com/
73bf00c6-9775-4d77-acc7-c5e45693a8fa	DB-1763260400983-W9UZ2	6b0648c1-e29a-4bf8-a018-b921b3f148ca	b61a06a6-a08d-402e-8f01-7e386574e77f	48bb0742-04f1-4a9f-b6a9-7655be47ec21	c7949da9-edb3-4321-9566-0dcf47a03a4f	8ab8b1a9-f481-4b54-b2ae-c20f42d75bee	2025-12-19 00:00:00	2026-01-03 00:00:00	confirmed	1000.00	900.00	100.00	0.00	\N	\N	2025-11-16 02:33:20.983381	2025-11-16 22:32:19.884099	https://web.whatsapp.com/
ab1afba7-8287-482e-bc0a-7d77f6e07b71	DB-1763254470071-5QNB0	1a1f1920-3ee3-4664-8741-2207b60ac298	0db25e9b-cc7b-451a-8bf5-71762743eabb	516e2599-c97f-422e-84b4-f1728c67cca5	8ab8b1a9-f481-4b54-b2ae-c20f42d75bee	8ab8b1a9-f481-4b54-b2ae-c20f42d75bee	2025-12-31 00:00:00	2026-01-31 00:00:00	confirmed	2130.00	2015.00	115.00	0.00	\N	\N	2025-11-16 00:54:30.071607	2025-11-16 22:32:24.727626	https://web.whatsapp.com/
e56a803a-c84e-4283-a518-b8e69ca95e65	DB-1763253664262-GK2RV	eda1002e-2773-4719-892d-7b2647ee7fb6	b61a06a6-a08d-402e-8f01-7e386574e77f	48bb0742-04f1-4a9f-b6a9-7655be47ec21	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	c7949da9-edb3-4321-9566-0dcf47a03a4f	2025-11-19 00:00:00	2025-12-06 00:00:00	confirmed	1020.00	1020.00	0.00	0.00	\N	\N	2025-11-16 00:41:04.262674	2025-11-16 22:32:30.498535	https://web.whatsapp.com/
6679420c-ad75-4683-b208-217eee144f36	DB-1763320018744-IPKR0	baae285b-658f-4104-b7be-28c81e608932	8c92fade-6fa4-45d2-a155-a49dd347f6b2	bb152d22-b295-4680-a7a2-b8783c249ed9	c7949da9-edb3-4321-9566-0dcf47a03a4f	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	2025-11-29 00:00:00	2025-12-06 00:00:00	completed	910.00	910.00	0.00	0.00	\N	\N	2025-11-16 19:06:58.744717	2025-11-16 22:35:11.733047	https://web.whatsapp.com/
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (id, code, description, discount_type, discount_value, minimum_rental_days, minimum_amount, valid_from, valid_until, usage_limit, usage_count, is_active, created_at, updated_at) FROM stdin;
3edee5e8-6d08-4fd7-bf77-3671e5145716	WELCOME10	Welcome discount for new customers	percentage	10.00	\N	\N	2025-11-14	2026-11-14	100	0	t	2025-11-14 19:26:42.256311	2025-11-14 19:26:42.256311
d9a2278c-6bec-4f59-9f78-fc1935f358bf	SUMMER2025	Summer promotion	percentage	15.00	\N	\N	2025-11-14	2026-05-14	50	0	t	2025-11-14 19:26:42.256311	2025-11-14 19:26:42.256311
d07bfc03-b1ba-478b-a9a0-c5747f12658e	DBLUX	\N	percentage	50.00	\N	\N	2025-11-16	2025-11-26	100	0	t	2025-11-16 22:26:17.10948	2025-11-17 01:31:38.420502
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, first_name, last_name, email, phone, date_of_birth, license_number, license_country, license_expiry, address, city, country, created_at, updated_at, is_blacklisted, blacklist_reason) FROM stdin;
03e3672c-1dc6-474a-82f0-960a7614bb88	John	Doe	john.doe@example.com	+212 612 345678	1990-01-15	DL123456	Morocco	\N	123 Main Street	Casablanca	Morocco	2025-11-14 19:26:42.255741	2025-11-14 19:26:42.255741	f	\N
5f91c9e4-5fa8-45b5-9664-6321c5b123c6	Tiago	Cordeiro	foewfow@gmail.com	+212434324234	\N	\N	\N	\N	\N	\N	Morocco	2025-11-15 15:22:28.993417	2025-11-15 15:22:28.993417	f	\N
149718bb-006b-4d3e-8673-42f78acc5d5e	gregre	greherhre	hrehr@gmail.com	+21232532532532	\N	\N	\N	\N	\N	\N	Morocco	2025-11-15 20:19:04.457165	2025-11-15 20:19:04.457165	f	\N
dd2e8db5-5b78-4e9f-8ce4-d02e76b56e45	gesregewg	egeveg	gewgew@gmail.com	+21221312412412	\N	\N	\N	\N	\N	\N	Morocco	2025-11-15 21:48:25.858892	2025-11-15 21:48:25.858892	f	\N
aad1e462-3e3a-4929-aad5-c50b8eae6465	gre	grregregr	gergrge@gmail.com	+212214422142421	\N	\N	\N	\N	\N	\N	Morocco	2025-11-16 00:34:50.597989	2025-11-16 00:34:50.597989	f	\N
ee234ab2-d6b3-46b6-a02a-372438fb9923	y5y54	y554	5y5454y55@gmail.com	+21212442142421	\N	\N	\N	\N	\N	\N	Morocco	2025-11-16 00:37:13.788995	2025-11-16 00:37:13.788995	f	\N
eda1002e-2773-4719-892d-7b2647ee7fb6	ffdfsf	fs	fs@gma	+21243434	\N	\N	\N	\N	\N	\N	Morocco	2025-11-16 00:41:04.258255	2025-11-16 00:41:04.258255	f	\N
1a1f1920-3ee3-4664-8741-2207b60ac298	fe	geewgeg	gewggegew@gmail.com	+2122432552352	\N	\N	\N	\N	\N	\N	Morocco	2025-11-16 00:54:30.067249	2025-11-16 00:54:30.067249	f	\N
6b0648c1-e29a-4bf8-a018-b921b3f148ca	dsvds	vdvdv	dvdsvvdvds@gmail.com	+2124234324	\N	\N	\N	\N	\N	\N	Morocco	2025-11-16 02:33:20.978636	2025-11-16 02:33:20.978636	f	\N
2697d1cb-72e8-45ea-a9ff-1aa7eb8715c1	ddssff	sffssf	sfsfs@gmail.com	+2123224424	\N	\N	\N	\N	\N	\N	Morocco	2025-11-16 17:02:27.72842	2025-11-16 17:02:27.72842	f	\N
f5bf3ad3-f289-411b-b2e7-a6756c8cfadb	dsgdsggdsg	gsdgsgsd	sggsgs@gmail.com	+212244242314	\N	\N	\N	\N	\N	\N	Morocco	2025-11-16 17:06:59.713875	2025-11-16 17:06:59.713875	f	\N
baae285b-658f-4104-b7be-28c81e608932	Tiago	Cordeiro	tiagolpc98@gmail.com	+212432235235	\N	\N	\N	\N	\N	\N	Morocco	2025-11-16 18:44:46.470467	2025-11-16 19:06:58.718901	f	\N
\.


--
-- Data for Name: damage_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.damage_logs (id, vehicle_subunit_id, booking_id, damage_description, damage_location, repair_cost, images, reported_by, reported_at, repaired_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: extras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extras (id, name, description, price, price_type, is_active, created_at, updated_at, cover_image) FROM stdin;
3476559c-695c-4692-b601-abc77d3c9083	Child Seat	Child safety seat for infants and toddlers	15.00	per_rental	t	2025-11-14 19:26:42.254979	2025-11-15 16:11:14.137975	http://localhost:3001/uploads/vehicles/generated-image (2)-1763223071592-38998173.png
459dc035-6c86-46c7-a330-63fd10ad0d73	Additional Driver	Add an additional authorized driver	25.00	per_rental	t	2025-11-14 19:26:42.254979	2025-11-15 16:17:59.5963	http://localhost:3001/uploads/vehicles/1-1763223478794-463900670.png
9990fc73-a088-4edd-b2a4-a42995c61c51	Full Insurance Coverage	Comprehensive insurance with zero deductible	50.00	per_day	t	2025-11-14 19:26:42.254979	2025-11-15 16:18:13.56029	http://localhost:3001/uploads/vehicles/5-1763223492756-83640863.png
4ed580a0-2a84-4148-886c-6db5f23f05ed	GPS Navigation	Portable GPS navigation device	10.00	per_rental	t	2025-11-14 19:26:42.254979	2025-11-15 16:18:24.719196	http://localhost:3001/uploads/vehicles/2-1763223503847-217883745.png
97e369c1-8f12-40a1-a1ae-53e5cab864ea	Premium Cleaning	Premium interior and exterior cleaning	30.00	per_rental	t	2025-11-14 19:26:42.254979	2025-11-15 16:18:33.52801	http://localhost:3001/uploads/vehicles/3-1763223512396-820221299.png
7b8542fc-983a-4ff0-b47c-731e64f2c003	Airport Delivery	Vehicle delivery to airport	75.00	per_rental	t	2025-11-14 19:26:42.254979	2025-11-15 16:18:42.588249	http://localhost:3001/uploads/vehicles/4-1763223521919-467975684.png
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.locations (id, name, address, city, country, phone, email, latitude, longitude, is_active, created_at, updated_at) FROM stdin;
c7949da9-edb3-4321-9566-0dcf47a03a4f	Casablanca Downtown	123 Boulevard Mohammed V	Casablanca	Morocco	+212 522 123456	casablanca@dbcars.com	33.57310000	-7.58980000	t	2025-11-14 19:26:42.250067	2025-11-14 19:26:42.250067
0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	Marrakech Guéliz	456 Avenue Mohammed VI	Marrakech	Morocco	+212 524 123456	marrakech@dbcars.com	31.62950000	-7.98110000	t	2025-11-14 19:26:42.250067	2025-11-14 19:26:42.250067
e6c80f03-dc31-416a-b577-2aa5445a11ba	Rabat Center	789 Avenue Allal Ben Abdellah	Rabat	Morocco	+212 537 123456	rabat@dbcars.com	34.02090000	-6.84160000	t	2025-11-14 19:26:42.250067	2025-11-14 19:26:42.250067
8ab8b1a9-f481-4b54-b2ae-c20f42d75bee	Fez Medina	321 Rue Talaa Kebira	Fez	Morocco	+212 535 123456	fez@dbcars.com	34.06250000	-4.97360000	t	2025-11-14 19:26:42.250067	2025-11-14 19:26:42.250067
\.


--
-- Data for Name: pricing_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pricing_plans (id, name, description, is_active, created_at, updated_at) FROM stdin;
4e182c23-e25f-464f-8137-9cf83167138a	Standard Plan	Standard pricing for all vehicles	t	2025-11-14 19:26:42.255366	2025-11-14 19:26:42.255366
a3c04991-6657-4abc-a32b-95f32c288815	Premium Plan	Premium pricing with additional services	t	2025-11-14 19:26:42.255366	2025-11-14 19:26:42.255366
\.


--
-- Data for Name: pricing_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pricing_rules (id, vehicle_id, pricing_plan_id, start_date, end_date, location_id, daily_price, weekly_price, monthly_price, hourly_price, multiplier, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, name, role, created_at, updated_at) FROM stdin;
3672403b-9884-424d-b4c3-5789564709d8	test@gmail.com	$2a$10$djG7VDKMcq82XH2QiEctYuO4uai8tiX99PfLofOGjZGj0BTFyrh3S	Test	admin	2025-11-14 21:12:28.990891	2025-11-14 21:12:28.990891
f63764c0-fcd7-47f0-adea-d85e3dee1886	admin@dbcars.com	$2a$10$/mc3286OBgx6r0LYiMA8D.zfEyQjWo3y4PQTHXhvQl7gxy2mQyeUG	Admin User	admin	2025-11-14 19:26:42.246829	2025-11-15 02:55:51.310765
440838a8-8af5-40df-b873-f9a5288999f9	tiagocordeiro@uptnable.com	$2a$10$OtTivTNHG1o3fkV54mj3ee80u7qWg1DOJUZEeVb8hiX12bMNIQ0yi	Tiago Cordeiro	admin	2025-11-15 13:31:32.397074	2025-11-15 13:31:32.397074
\.


--
-- Data for Name: vehicle_extras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_extras (id, vehicle_id, extra_id, created_at) FROM stdin;
3b02ba5c-989b-40ef-b281-f23b68bc4719	54915359-64e0-40bf-8723-474d20e13c65	3476559c-695c-4692-b601-abc77d3c9083	2025-11-15 22:13:37.232725
cb4821a6-59bf-418c-8deb-b366c24f03f2	54915359-64e0-40bf-8723-474d20e13c65	459dc035-6c86-46c7-a330-63fd10ad0d73	2025-11-15 22:13:37.235396
27c82e4a-bf0e-4e0f-8437-9b40be21d56e	54915359-64e0-40bf-8723-474d20e13c65	4ed580a0-2a84-4148-886c-6db5f23f05ed	2025-11-15 22:13:37.236068
d85cedda-737b-42e3-9635-2758d46b0cfa	54915359-64e0-40bf-8723-474d20e13c65	7b8542fc-983a-4ff0-b47c-731e64f2c003	2025-11-15 22:13:37.236651
6ee8bece-0635-4d1e-82b1-e563f321eac3	54915359-64e0-40bf-8723-474d20e13c65	97e369c1-8f12-40a1-a1ae-53e5cab864ea	2025-11-15 22:13:37.237238
d4fe8fb9-7182-4e76-bea4-0ebec4e0c1b1	54915359-64e0-40bf-8723-474d20e13c65	9990fc73-a088-4edd-b2a4-a42995c61c51	2025-11-15 22:13:37.237794
69f928c6-668f-42fe-afc3-515362009648	8c92fade-6fa4-45d2-a155-a49dd347f6b2	459dc035-6c86-46c7-a330-63fd10ad0d73	2025-11-15 22:20:01.853518
9bb8a0fa-eb99-489f-ab76-33c2d7a56776	8c92fade-6fa4-45d2-a155-a49dd347f6b2	7b8542fc-983a-4ff0-b47c-731e64f2c003	2025-11-15 22:20:01.854855
ae816545-d167-486c-a5f6-99fe72b534f8	8c92fade-6fa4-45d2-a155-a49dd347f6b2	9990fc73-a088-4edd-b2a4-a42995c61c51	2025-11-15 22:20:01.855422
76159ea9-9f0c-458c-81e8-ca403d247c7b	8c92fade-6fa4-45d2-a155-a49dd347f6b2	3476559c-695c-4692-b601-abc77d3c9083	2025-11-15 22:20:01.855943
476827df-fb32-4a1a-868f-9cacb541b837	8c92fade-6fa4-45d2-a155-a49dd347f6b2	4ed580a0-2a84-4148-886c-6db5f23f05ed	2025-11-15 22:20:01.856499
3c776655-697f-4bdb-bb5b-1a9907bc27bb	8c92fade-6fa4-45d2-a155-a49dd347f6b2	97e369c1-8f12-40a1-a1ae-53e5cab864ea	2025-11-15 22:20:01.856988
b5a50c6f-8c6d-49e4-b518-b1030911f862	d046097c-a981-4a65-8bb8-ff954e32bd35	459dc035-6c86-46c7-a330-63fd10ad0d73	2025-11-15 22:24:06.579197
f50c6763-e427-40c1-b84d-3f35f335ad35	d046097c-a981-4a65-8bb8-ff954e32bd35	7b8542fc-983a-4ff0-b47c-731e64f2c003	2025-11-15 22:24:06.580529
539ff73e-3b97-44b2-b556-0283b32ebc41	d046097c-a981-4a65-8bb8-ff954e32bd35	3476559c-695c-4692-b601-abc77d3c9083	2025-11-15 22:24:06.58115
dcdc5a73-7625-4663-9d13-6d0f8a2e12b1	d046097c-a981-4a65-8bb8-ff954e32bd35	9990fc73-a088-4edd-b2a4-a42995c61c51	2025-11-15 22:24:06.581678
35f8fa41-6aa5-4aeb-bb69-8a35861e84db	d046097c-a981-4a65-8bb8-ff954e32bd35	4ed580a0-2a84-4148-886c-6db5f23f05ed	2025-11-15 22:24:06.582194
382c4017-73cc-4d72-ad12-2c720db3b391	d046097c-a981-4a65-8bb8-ff954e32bd35	97e369c1-8f12-40a1-a1ae-53e5cab864ea	2025-11-15 22:24:06.582753
dd6f3544-5376-41ea-b651-b4301329029e	873ec648-2c50-418d-a64a-66f0d43a125c	459dc035-6c86-46c7-a330-63fd10ad0d73	2025-11-15 22:28:06.970248
f2665060-1af5-40c9-b512-a1e423720366	873ec648-2c50-418d-a64a-66f0d43a125c	7b8542fc-983a-4ff0-b47c-731e64f2c003	2025-11-15 22:28:06.971319
fff5ee2c-cfd3-4f27-a4c3-dcb09f7ba0a7	873ec648-2c50-418d-a64a-66f0d43a125c	3476559c-695c-4692-b601-abc77d3c9083	2025-11-15 22:28:06.97166
bee5e487-c70d-4e74-b565-71e167caee6c	873ec648-2c50-418d-a64a-66f0d43a125c	9990fc73-a088-4edd-b2a4-a42995c61c51	2025-11-15 22:28:06.972001
c2e6daa3-8241-49c5-a9a2-25717db6f4e2	873ec648-2c50-418d-a64a-66f0d43a125c	4ed580a0-2a84-4148-886c-6db5f23f05ed	2025-11-15 22:28:06.972364
056140f6-37a4-4fe7-a01a-539dcb0506b2	873ec648-2c50-418d-a64a-66f0d43a125c	97e369c1-8f12-40a1-a1ae-53e5cab864ea	2025-11-15 22:28:06.972687
69dc34af-5cdb-4771-9963-dde5c234cbe5	100bd98e-8853-4080-84b5-b1443cf17d43	3476559c-695c-4692-b601-abc77d3c9083	2025-11-15 22:35:43.993272
c563320d-c32d-4ff3-a55d-181a25607de5	100bd98e-8853-4080-84b5-b1443cf17d43	459dc035-6c86-46c7-a330-63fd10ad0d73	2025-11-15 22:35:43.993835
cacbd779-d8b9-4274-b385-a8ff49fa3d15	100bd98e-8853-4080-84b5-b1443cf17d43	7b8542fc-983a-4ff0-b47c-731e64f2c003	2025-11-15 22:35:43.994241
cdf5e048-1e50-4870-a92a-f880f9b5cc1d	100bd98e-8853-4080-84b5-b1443cf17d43	9990fc73-a088-4edd-b2a4-a42995c61c51	2025-11-15 22:35:43.994566
a412e485-605c-4654-83b3-46ab1e4dadb6	2536a097-f5e8-4d8b-a642-2c4e04def1e9	459dc035-6c86-46c7-a330-63fd10ad0d73	2025-11-15 23:01:25.002335
5368b8a2-d101-404b-9ac4-aee9a4605b32	2536a097-f5e8-4d8b-a642-2c4e04def1e9	7b8542fc-983a-4ff0-b47c-731e64f2c003	2025-11-15 23:01:25.002984
82d8d577-bee9-46a7-ac99-98c68aaf3b37	2536a097-f5e8-4d8b-a642-2c4e04def1e9	3476559c-695c-4692-b601-abc77d3c9083	2025-11-15 23:01:25.003377
2452ce51-dc73-4ccd-a305-40384a0090d4	2536a097-f5e8-4d8b-a642-2c4e04def1e9	9990fc73-a088-4edd-b2a4-a42995c61c51	2025-11-15 23:01:25.003789
10b57bf4-3302-4165-91ab-108e99e4b0a0	2536a097-f5e8-4d8b-a642-2c4e04def1e9	4ed580a0-2a84-4148-886c-6db5f23f05ed	2025-11-15 23:01:25.004239
91da007f-f648-4fec-9244-83a1afa11252	2536a097-f5e8-4d8b-a642-2c4e04def1e9	97e369c1-8f12-40a1-a1ae-53e5cab864ea	2025-11-15 23:01:25.006364
03d757eb-63a6-482d-9711-fdf0189b17c5	0db25e9b-cc7b-451a-8bf5-71762743eabb	459dc035-6c86-46c7-a330-63fd10ad0d73	2025-11-15 23:05:27.036989
09d47208-81c7-4ec2-872c-498d64d9b06f	0db25e9b-cc7b-451a-8bf5-71762743eabb	3476559c-695c-4692-b601-abc77d3c9083	2025-11-15 23:05:27.037853
89a9fa13-cb11-46df-adb6-37fc2fd5b17d	0db25e9b-cc7b-451a-8bf5-71762743eabb	9990fc73-a088-4edd-b2a4-a42995c61c51	2025-11-15 23:05:27.03847
833f85af-1a45-459d-853d-2d198c8298f5	0db25e9b-cc7b-451a-8bf5-71762743eabb	7b8542fc-983a-4ff0-b47c-731e64f2c003	2025-11-15 23:05:27.039026
182852a5-0d50-4efc-b59d-50352aed8d75	0db25e9b-cc7b-451a-8bf5-71762743eabb	4ed580a0-2a84-4148-886c-6db5f23f05ed	2025-11-15 23:05:27.039533
df8bf3b2-2ebb-43e0-95f2-98769aff9848	0db25e9b-cc7b-451a-8bf5-71762743eabb	97e369c1-8f12-40a1-a1ae-53e5cab864ea	2025-11-15 23:05:27.040034
0941f5d0-629b-4429-b685-144b246e0ba6	b61a06a6-a08d-402e-8f01-7e386574e77f	459dc035-6c86-46c7-a330-63fd10ad0d73	2025-11-15 23:08:12.284314
986b56f4-47cb-4e76-a03c-b8767f299f51	b61a06a6-a08d-402e-8f01-7e386574e77f	7b8542fc-983a-4ff0-b47c-731e64f2c003	2025-11-15 23:08:12.285176
73dde749-c276-44fc-a6a6-812723e62bfa	b61a06a6-a08d-402e-8f01-7e386574e77f	3476559c-695c-4692-b601-abc77d3c9083	2025-11-15 23:08:12.285541
ac359550-8c8f-4af5-8a6a-a93a362e9f60	b61a06a6-a08d-402e-8f01-7e386574e77f	9990fc73-a088-4edd-b2a4-a42995c61c51	2025-11-15 23:08:12.285883
3e47aa7b-942f-46be-843a-4f34a53d1912	b61a06a6-a08d-402e-8f01-7e386574e77f	4ed580a0-2a84-4148-886c-6db5f23f05ed	2025-11-15 23:08:12.286183
3cc8d9fc-eb86-4b25-9b86-2c15dde2c3d0	b61a06a6-a08d-402e-8f01-7e386574e77f	97e369c1-8f12-40a1-a1ae-53e5cab864ea	2025-11-15 23:08:12.286469
c255e482-b729-4548-b043-6209c2b7a2b8	c9f994d8-d4c1-45ef-9967-c995dec4bb98	459dc035-6c86-46c7-a330-63fd10ad0d73	2025-11-15 23:10:02.591304
ee3db45d-c98f-4fca-a558-6db68eaa0b90	c9f994d8-d4c1-45ef-9967-c995dec4bb98	7b8542fc-983a-4ff0-b47c-731e64f2c003	2025-11-15 23:10:02.592184
caf10128-01da-42ee-8bb1-177953e01361	c9f994d8-d4c1-45ef-9967-c995dec4bb98	3476559c-695c-4692-b601-abc77d3c9083	2025-11-15 23:10:02.592868
6accce02-62c2-486a-a0a0-0e48c88cae87	c9f994d8-d4c1-45ef-9967-c995dec4bb98	9990fc73-a088-4edd-b2a4-a42995c61c51	2025-11-15 23:10:02.593424
a73e6f40-562e-4ae0-bac6-667a302e6c14	c9f994d8-d4c1-45ef-9967-c995dec4bb98	4ed580a0-2a84-4148-886c-6db5f23f05ed	2025-11-15 23:10:02.594103
c17d4615-8c4c-45d9-bf80-0115eb1b0d1d	c9f994d8-d4c1-45ef-9967-c995dec4bb98	97e369c1-8f12-40a1-a1ae-53e5cab864ea	2025-11-15 23:10:02.594614
\.


--
-- Data for Name: vehicle_subunits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_subunits (id, vehicle_id, license_plate, vin, status, current_location_id, mileage, notes, created_at, updated_at) FROM stdin;
fe47eed2-2b6e-453a-8219-6e17f0c9ba71	54915359-64e0-40bf-8723-474d20e13c65	Abc-001	1234567	available	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	100000	\N	2025-11-15 22:12:41.120358	2025-11-15 22:13:37.239243
2118031c-5cb4-4846-9267-97b17d4e6157	d046097c-a981-4a65-8bb8-ff954e32bd35	ABC-1234	124412512	available	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	400000	\N	2025-11-15 22:24:06.585077	2025-11-15 22:24:06.585077
8aa57fde-6ff6-48f4-9644-129d6f2a56e7	100bd98e-8853-4080-84b5-b1443cf17d43	Abc-12424	3242523532	available	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	1000000	\N	2025-11-15 22:31:35.735454	2025-11-15 22:35:43.99523
167f9300-61a1-4d84-b4ba-d29f32a3138f	2536a097-f5e8-4d8b-a642-2c4e04def1e9	ABC-3554	767656464	available	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	56000	\N	2025-11-15 23:01:25.007838	2025-11-15 23:01:25.007838
5f9044b8-688d-4802-8b89-9841414872a8	c9f994d8-d4c1-45ef-9967-c995dec4bb98	ABC-12353	535325235	available	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	50000	\N	2025-11-15 23:10:02.596383	2025-11-15 23:10:02.596383
516e2599-c97f-422e-84b4-f1728c67cca5	0db25e9b-cc7b-451a-8bf5-71762743eabb	ABC-1307	3453456	reserved	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	50000	\N	2025-11-15 23:05:27.041796	2025-11-16 17:10:45.025985
5bf8bcd0-c2ab-42b2-a994-67984f76fa1f	2081fb3e-61d2-4737-b1dc-3521f0b65c2a	ABC-124	5353523	reserved	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	45000	\N	2025-11-15 22:50:01.755808	2025-11-16 22:32:07.640718
fd15cf94-0728-44a7-b8ea-94fb2463934b	873ec648-2c50-418d-a64a-66f0d43a125c	ABC-13425	421241421421	reserved	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	500000	\N	2025-11-15 22:28:06.973517	2025-11-16 22:32:16.066842
48bb0742-04f1-4a9f-b6a9-7655be47ec21	b61a06a6-a08d-402e-8f01-7e386574e77f	ABC-376	3562636	reserved	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	56000	\N	2025-11-15 23:08:12.287676	2025-11-16 22:32:19.092639
bb152d22-b295-4680-a7a2-b8783c249ed9	8c92fade-6fa4-45d2-a155-a49dd347f6b2	AB-1234	3532523	returned	0eb8fc3a-c905-4ac6-89b3-f54fd989c3e6	10000	\N	2025-11-15 22:20:01.859663	2025-11-16 22:35:11.739543
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, make, model, year, category, description, seats, transmission, fuel_type, features, images, base_price_daily, base_price_weekly, base_price_monthly, base_price_hourly, minimum_rental_days, minimum_age, is_active, created_at, updated_at, color) FROM stdin;
8c92fade-6fa4-45d2-a155-a49dd347f6b2	Range Rover	Sport	2025	luxury	Dynamic and sporty luxury SUV with 355 HP and cutting-edge features. 0–100 km/h in 5.7 seconds, sport styling, Pivi Pro infotainment, four-zone climate, and advanced safety. Ideal for families and business travel needing both excitement and comfort.	5	automatic	gasoline	{}	{"http://localhost:3001/uploads/vehicles/A highly detailed, realistic photograph of a sleek, dark Range Rover Sport parked in a dimly lit studio with a dark, seamless background, emphasizing its modern design and sharp lines.-1763245199043-327967750.jpg"}	130.00	\N	\N	\N	1	25	t	2025-11-15 22:20:01.844146	2025-11-15 22:20:01.844146	Black
0db25e9b-cc7b-451a-8bf5-71762743eabb	Renault	Clio Techno	2025	luxury	Mid-range Clio with high-tech features, stylish upgrades, and comfort options. Techno is a best-value trim for tech lovers.	5	automatic	gasoline	{}	{http://localhost:3001/uploads/vehicles/Renault-Clio-Techno-1763247925241-311234283.jpg}	65.00	\N	\N	\N	1	25	t	2025-11-15 23:05:27.032406	2025-11-15 23:05:27.032406	Black
b61a06a6-a08d-402e-8f01-7e386574e77f	Renault	Clio Iconic	2025	luxury	Combines comfort, safety, and technology in a balanced trim that suits both city and highway journeys.	5	automatic	gasoline	{}	{http://localhost:3001/uploads/vehicles/Renault-Clio-Iconic-1763248090570-630243353.jpg}	60.00	\N	\N	\N	1	25	t	2025-11-15 23:08:12.280824	2025-11-15 23:08:12.280824	Black
c9f994d8-d4c1-45ef-9967-c995dec4bb98	Renault	Clio Esprit Alpine	2025	luxury	Premium sport-inspired version with Alpine badge—unique styling, best tech/features package, and exclusive colors. Top performance Clio for driving experience fans.	5	automatic	gasoline	{}	{http://localhost:3001/uploads/vehicles/CLIO-esprit-Alpine-1763248200365-636803306.jpg}	70.00	\N	\N	\N	1	25	t	2025-11-15 23:10:02.587526	2025-11-15 23:10:02.587526	Black
d046097c-a981-4a65-8bb8-ff954e32bd35	Range Rover 	Vogue	2025	luxury	The ultimate luxury SUV, combining supreme comfort with advanced technology, air suspension, a refined leather interior with 20-way heated/ventilated seats, Meridian audio, and Terrain Response 2 AWD. Power: 395–530 HP, 0–100 km/h in 5.7 seconds. Premium choice for VIP and executive travel.	5	automatic	gasoline	{}	{http://localhost:3001/uploads/vehicles/rangeroverevoque-1763245444958-501649658.jpg}	170.00	\N	\N	\N	1	25	t	2025-11-15 22:24:06.571216	2025-11-15 22:24:06.571216	Black
873ec648-2c50-418d-a64a-66f0d43a125c	Audi	RS3 Sportback	2025	luxury	High-performance hatchback/sedan with 394 HP, Quattro AWD, RS sport seats, cutting-edge technology, and distinctive design. 0–100 km/h in 3.8 sec. Ideal for sports car lovers and special occasions.	4	automatic	gasoline	{}	{"http://localhost:3001/uploads/vehicles/realistic image of a Audi RS3 Sportback in a dark background-1763245684954-943956391.jpg"}	80.00	\N	\N	\N	1	25	t	2025-11-15 22:28:06.966824	2025-11-15 22:28:06.966824	Black
54915359-64e0-40bf-8723-474d20e13c65	Range Rover	Evoque	2025	luxury	Stylish compact luxury SUV with urban-friendly size. Engine options up to 269 HP, advanced tech including ClearSight rear-view mirror and 3D cameras, premium interior, and AWD. Perfect for city breaks with off-road capability.	5	automatic	hybrid	{}	{"http://localhost:3001/uploads/vehicles/realistic image of a Land Rover Range Rover Evoque in a dark background-1763244617409-524062978.jpg"}	150.00	0.00	0.00	0.00	1	25	t	2025-11-15 22:12:41.10258	2025-11-15 22:13:37.220113	Black
100bd98e-8853-4080-84b5-b1443cf17d43	Ford	Transit 8-Seater	2025	luxury	Spacious, comfortable van for group travel. Modern amenities, rear climate control, multiple engine options, easy entry/exit, ideal for airport transfers and tours.	8	manual	gasoline	{}	{http://localhost:3001/uploads/vehicles/ford8seater-1763246041593-931134878.jpg}	200.00	0.00	0.00	0.00	1	25	t	2025-11-15 22:31:35.721633	2025-11-15 22:35:43.990758	Black
2081fb3e-61d2-4737-b1dc-3521f0b65c2a	Alpine	A110 Sport	2025	luxury	Lightweight French sports car with up to 300 HP, mid-engine RWD, 0–100 km/h in 4.2 sec, and pure driving pleasure. Perfect for enthusiasts and picturesque drives.	2	automatic	gasoline	{}	{http://localhost:3001/uploads/vehicles/alpina110-1763246999368-666155286.jpg}	75.00	\N	\N	\N	1	25	t	2025-11-15 22:50:01.745648	2025-11-15 22:50:01.745648	Black
2536a097-f5e8-4d8b-a642-2c4e04def1e9	Renault	Clio Evolution	2025	luxury	Entry-level Clio packed with essential tech, stylish design, and leading safety features. Efficient and reliable for everyday city use.	5	manual	gasoline	{}	{http://localhost:3001/uploads/vehicles/Renault-Clio-Evolution-1763247683470-501261181.jpg}	55.00	\N	\N	\N	1	25	t	2025-11-15 23:01:24.997655	2025-11-15 23:01:24.997655	Black
\.


--
-- Name: blog_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tiagocordeiro
--

SELECT pg_catalog.setval('public.blog_posts_id_seq', 1, true);


--
-- Name: availability_notes availability_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_notes
    ADD CONSTRAINT availability_notes_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: tiagocordeiro
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: booking_extras booking_extras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_extras
    ADD CONSTRAINT booking_extras_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_booking_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_number_key UNIQUE (booking_number);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: damage_logs damage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.damage_logs
    ADD CONSTRAINT damage_logs_pkey PRIMARY KEY (id);


--
-- Name: extras extras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extras
    ADD CONSTRAINT extras_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: pricing_plans pricing_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_plans
    ADD CONSTRAINT pricing_plans_pkey PRIMARY KEY (id);


--
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicle_extras vehicle_extras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_extras
    ADD CONSTRAINT vehicle_extras_pkey PRIMARY KEY (id);


--
-- Name: vehicle_extras vehicle_extras_vehicle_id_extra_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_extras
    ADD CONSTRAINT vehicle_extras_vehicle_id_extra_id_key UNIQUE (vehicle_id, extra_id);


--
-- Name: vehicle_subunits vehicle_subunits_license_plate_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_subunits
    ADD CONSTRAINT vehicle_subunits_license_plate_key UNIQUE (license_plate);


--
-- Name: vehicle_subunits vehicle_subunits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_subunits
    ADD CONSTRAINT vehicle_subunits_pkey PRIMARY KEY (id);


--
-- Name: vehicle_subunits vehicle_subunits_vin_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_subunits
    ADD CONSTRAINT vehicle_subunits_vin_key UNIQUE (vin);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: idx_availability_notes_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_notes_date ON public.availability_notes USING btree (note_date);


--
-- Name: idx_availability_notes_vehicle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_notes_vehicle_id ON public.availability_notes USING btree (vehicle_id);


--
-- Name: idx_blog_posts_created_at; Type: INDEX; Schema: public; Owner: tiagocordeiro
--

CREATE INDEX idx_blog_posts_created_at ON public.blog_posts USING btree (created_at DESC);


--
-- Name: idx_blog_posts_published; Type: INDEX; Schema: public; Owner: tiagocordeiro
--

CREATE INDEX idx_blog_posts_published ON public.blog_posts USING btree (is_published);


--
-- Name: idx_bookings_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_created_at ON public.bookings USING btree (created_at);


--
-- Name: idx_bookings_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_customer_id ON public.bookings USING btree (customer_id);


--
-- Name: idx_bookings_customer_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_customer_status ON public.bookings USING btree (customer_id, status);


--
-- Name: idx_bookings_dropoff_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_dropoff_date ON public.bookings USING btree (dropoff_date);


--
-- Name: idx_bookings_pickup_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_pickup_date ON public.bookings USING btree (pickup_date);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_status_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_status_dates ON public.bookings USING btree (status, pickup_date, dropoff_date);


--
-- Name: idx_bookings_vehicle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_vehicle_id ON public.bookings USING btree (vehicle_id);


--
-- Name: idx_bookings_vehicle_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_vehicle_status ON public.bookings USING btree (vehicle_id, status);


--
-- Name: idx_customers_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_created_at ON public.customers USING btree (created_at);


--
-- Name: idx_pricing_rules_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pricing_rules_dates ON public.pricing_rules USING btree (start_date, end_date);


--
-- Name: idx_pricing_rules_vehicle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pricing_rules_vehicle_id ON public.pricing_rules USING btree (vehicle_id);


--
-- Name: idx_vehicle_extras_extra_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_extras_extra_id ON public.vehicle_extras USING btree (extra_id);


--
-- Name: idx_vehicle_extras_vehicle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_extras_vehicle_id ON public.vehicle_extras USING btree (vehicle_id);


--
-- Name: idx_vehicle_subunits_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_subunits_status ON public.vehicle_subunits USING btree (status);


--
-- Name: idx_vehicle_subunits_vehicle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_subunits_vehicle_id ON public.vehicle_subunits USING btree (vehicle_id);


--
-- Name: idx_vehicle_subunits_vehicle_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_subunits_vehicle_status ON public.vehicle_subunits USING btree (vehicle_id, status);


--
-- Name: idx_vehicles_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_active ON public.vehicles USING btree (is_active);


--
-- Name: idx_vehicles_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_category ON public.vehicles USING btree (category);


--
-- Name: availability_notes update_availability_notes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_availability_notes_updated_at BEFORE UPDATE ON public.availability_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blog_posts update_blog_posts_updated_at; Type: TRIGGER; Schema: public; Owner: tiagocordeiro
--

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: coupons update_coupons_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: damage_logs update_damage_logs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_damage_logs_updated_at BEFORE UPDATE ON public.damage_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: extras update_extras_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_extras_updated_at BEFORE UPDATE ON public.extras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: locations update_locations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pricing_plans update_pricing_plans_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON public.pricing_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pricing_rules update_pricing_rules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vehicle_subunits update_vehicle_subunits_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vehicle_subunits_updated_at BEFORE UPDATE ON public.vehicle_subunits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vehicles update_vehicles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: availability_notes availability_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_notes
    ADD CONSTRAINT availability_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: availability_notes availability_notes_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_notes
    ADD CONSTRAINT availability_notes_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: availability_notes availability_notes_vehicle_subunit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_notes
    ADD CONSTRAINT availability_notes_vehicle_subunit_id_fkey FOREIGN KEY (vehicle_subunit_id) REFERENCES public.vehicle_subunits(id) ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiagocordeiro
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: booking_extras booking_extras_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_extras
    ADD CONSTRAINT booking_extras_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_extras booking_extras_extra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_extras
    ADD CONSTRAINT booking_extras_extra_id_fkey FOREIGN KEY (extra_id) REFERENCES public.extras(id) ON DELETE RESTRICT;


--
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;


--
-- Name: bookings bookings_dropoff_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_dropoff_location_id_fkey FOREIGN KEY (dropoff_location_id) REFERENCES public.locations(id);


--
-- Name: bookings bookings_pickup_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pickup_location_id_fkey FOREIGN KEY (pickup_location_id) REFERENCES public.locations(id);


--
-- Name: bookings bookings_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;


--
-- Name: bookings bookings_vehicle_subunit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_vehicle_subunit_id_fkey FOREIGN KEY (vehicle_subunit_id) REFERENCES public.vehicle_subunits(id);


--
-- Name: damage_logs damage_logs_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.damage_logs
    ADD CONSTRAINT damage_logs_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: damage_logs damage_logs_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.damage_logs
    ADD CONSTRAINT damage_logs_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(id);


--
-- Name: damage_logs damage_logs_vehicle_subunit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.damage_logs
    ADD CONSTRAINT damage_logs_vehicle_subunit_id_fkey FOREIGN KEY (vehicle_subunit_id) REFERENCES public.vehicle_subunits(id) ON DELETE CASCADE;


--
-- Name: pricing_rules pricing_rules_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: pricing_rules pricing_rules_pricing_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pricing_plan_id_fkey FOREIGN KEY (pricing_plan_id) REFERENCES public.pricing_plans(id) ON DELETE CASCADE;


--
-- Name: pricing_rules pricing_rules_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: vehicle_extras vehicle_extras_extra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_extras
    ADD CONSTRAINT vehicle_extras_extra_id_fkey FOREIGN KEY (extra_id) REFERENCES public.extras(id) ON DELETE CASCADE;


--
-- Name: vehicle_extras vehicle_extras_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_extras
    ADD CONSTRAINT vehicle_extras_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: vehicle_subunits vehicle_subunits_current_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_subunits
    ADD CONSTRAINT vehicle_subunits_current_location_id_fkey FOREIGN KEY (current_location_id) REFERENCES public.locations(id);


--
-- Name: vehicle_subunits vehicle_subunits_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_subunits
    ADD CONSTRAINT vehicle_subunits_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict H5bL5yaE30vxyiqtvg4k6KieHzWbFgGRyeEGOmgBIlo6OIczdThHKir3cyAjhVv

