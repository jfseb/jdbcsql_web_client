CREATE TABLE IF NOT EXISTS logtable (
          id serial primary key,
          ts timestamp default current_timestamp,
          level varchar(10) not null,
          message varchar(1024) not null,
          meta json
)
