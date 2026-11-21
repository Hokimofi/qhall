-- =====================================================================
-- App da Igreja — banco de dados (Supabase / PostgreSQL)
-- Rode este arquivo inteiro UMA vez no SQL Editor de um projeto novo.
-- Toda a segurança está aqui (RLS). O front-end usa só a chave anon.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TABELAS
-- ---------------------------------------------------------------------

create table public.areas (
  id   bigint generated always as identity primary key,
  nome text not null unique
);

-- Um líder = um usuário do Supabase Auth com acesso liberado.
create table public.lideres (
  id      uuid primary key references auth.users (id) on delete cascade,
  nome    text not null,
  email   text,
  area_id bigint references public.areas (id) on delete restrict,
  papel   text not null default 'lider' check (papel in ('admin', 'lider')),
  ultimo_acesso timestamptz,  -- atualizado pelo app a cada abertura (registrar_acesso)
  constraint lider_precisa_de_area check (papel = 'admin' or area_id is not null)
);

-- Convites: o admin cadastra e-mail, nome, área e papel. Quando a pessoa
-- entra pela primeira vez (e-mail/senha ou Google) com esse e-mail
-- confirmado, o app chama aceitar_convite() e ela vira líder.
-- Assim nenhum login é criado com service_role.
create table public.convites_lideres (
  email     text primary key check (email = lower(email)),
  nome      text not null,
  area_id   bigint references public.areas (id) on delete restrict,
  papel     text not null default 'lider' check (papel in ('admin', 'lider')),
  criado_em timestamptz not null default now(),
  constraint convite_precisa_de_area check (papel = 'admin' or area_id is not null)
);

-- Membros: cadastro geral da igreja (aniversários e contatos), sem login e
-- sem vínculo com as áreas das equipes. Só o admin vê e edita.
create table public.membros (
  id              bigint generated always as identity primary key,
  nome            text not null,
  data_nascimento date,
  telefone        text,
  observacoes     text
);

-- Eventos semanais (ADM): cada data vira um evento próprio, com escala e conclusão separadas.
-- "ativa = false" deixa a recorrência pendente (não aparece no calendário).
create table public.recorrencias (
  id          bigint generated always as identity primary key,
  titulo      text not null,
  tipo        text not null default 'culto' check (tipo in ('culto', 'ensaio', 'reuniao', 'aula')),
  dias        smallint[] not null default '{}' check (dias <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]), -- 0 = domingo
  horario     time,
  area_id     bigint references public.areas (id) on delete restrict,
  observacoes text,
  ativa       boolean not null default false,
  inicio      date not null default current_date,
  gerado_ate  date,
  fim         date,                          -- última data da série (vazio = sem fim)
  pulos       date[] not null default '{}',  -- datas que não devem ser criadas (excluídas ou movidas só nelas)
  criado_por  uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em   timestamptz not null default now()
);

create table public.eventos (
  id          bigint generated always as identity primary key,
  data        date not null,
  horario     time,
  titulo      text not null,
  tipo        text not null default 'culto' check (tipo in ('culto', 'ensaio', 'reuniao', 'aula')),
  observacoes text,
  -- ministério responsável (opcional; vazio = evento geral da igreja)
  area_id     bigint references public.areas (id) on delete restrict,
  -- quem criou (só o admin cria, edita, apaga e conclui eventos oficiais)
  criado_por  uuid default auth.uid() references auth.users (id) on delete set null,
  -- conclusão (só o admin marca, pela bolinha vermelha no calendário)
  concluido_em  timestamptz,
  concluido_por uuid references auth.users (id) on delete set null,
  -- ocorrência de um evento semanal (vazio = evento avulso)
  recorrencia_id bigint references public.recorrencias (id) on delete set null,
  -- ocorrência alterada com "Só este evento": a série não sobrescreve
  avulso boolean not null default false
);

create table public.itens_programa (
  id        bigint generated always as identity primary key,
  evento_id bigint not null references public.eventos (id) on delete cascade,
  area_id   bigint not null references public.areas (id) on delete restrict,
  ordem     integer not null default 0,
  titulo    text not null,
  tipo      text not null check (tipo in ('musica', 'danca', 'teatro', 'aviso')),
  -- horário estimado (opcional; o app mostra como previsão)
  horario   time,
  -- 'aniversariantes' = lembrete automático do último domingo do mês (gatilho)
  lembrete  text
);

create table public.musicas (
  id        bigint generated always as identity primary key,
  titulo    text not null,
  tom       text,   -- não é mais usado pelo app (v7); mantido para não perder dados antigos
  link      text,
  evento_id bigint not null references public.eventos (id) on delete cascade,
  area_id   bigint not null references public.areas (id) on delete restrict,
  ordem     integer not null default 0
);

-- Escalas: o líder da equipe digita o nome de quem vai servir (texto livre).
-- Não há ligação com o cadastro de membros.
create table public.escalas (
  id        bigint generated always as identity primary key,
  evento_id bigint not null references public.eventos (id) on delete cascade,
  area_id   bigint not null references public.areas (id) on delete restrict,
  funcao    text not null,
  nome      text not null check (length(trim(nome)) > 0)
);

create table public.anotacoes_area (
  id            bigint generated always as identity primary key,
  area_id       bigint not null references public.areas (id) on delete restrict,
  texto         text not null,
  atualizado_em timestamptz not null default now()
);

-- Materiais para o Audiovisual: arquivos de áudio/vídeo (no Storage) ou links, por evento.
-- area_id = ministério que enviou. Arquivo fica em materiais/<evento>/<ministério>/<arquivo>.
create table public.materiais (
  id          bigint generated always as identity primary key,
  evento_id   bigint not null references public.eventos (id) on delete cascade,
  area_id     bigint not null references public.areas (id) on delete restrict,
  tipo        text not null check (tipo in ('arquivo', 'link')),
  nome        text not null check (length(trim(nome)) > 0),
  quando_usar text,
  caminho     text,
  url         text,
  tamanho     bigint,
  enviado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em   timestamptz not null default now(),
  constraint material_tem_destino check ((tipo = 'arquivo' and caminho is not null) or (tipo = 'link' and url ~* '^https?://')),
  constraint material_caminho_coerente check (caminho is null or caminho like (evento_id::text || '/' || area_id::text || '/%'))
);

-- Reuniões: o ADM agenda; cada líder responde Vou ou Não vou (uma resposta por conta, pode mudar).
create table public.reunioes (
  id         bigint generated always as identity primary key,
  titulo     text not null,
  data       date not null,
  horario    time,
  local      text,
  pauta      text,
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em  timestamptz not null default now(),
  -- reunião realizada (só o admin marca)
  concluido_em  timestamptz,
  concluido_por uuid references auth.users (id) on delete set null
);

create table public.respostas_reuniao (
  reuniao_id    bigint not null references public.reunioes (id) on delete cascade,
  lider_id      uuid not null references public.lideres (id) on delete cascade,
  resposta      text not null check (resposta in ('vou', 'nao_vou')),
  respondido_em timestamptz not null default now(),
  primary key (reuniao_id, lider_id)
);

-- "Pular escala desta data": a equipe marca que não precisa de escala naquele evento.
-- Vale só para aquele ministério naquela data; o evento continua no calendário.
create table public.escalas_dispensadas (
  evento_id      bigint not null references public.eventos (id) on delete cascade,
  area_id        bigint not null references public.areas (id) on delete cascade,
  dispensado_por uuid default auth.uid() references auth.users (id) on delete set null,
  dispensado_em  timestamptz not null default now(),
  primary key (evento_id, area_id)
);

-- "area_id" vê os itens de "pode_ver_area_id".
-- Permissões são configuração: saem junto quando a área é apagada.
-- Qualquer outro registro ligado à área (itens, músicas, escalas,
-- anotações, líderes, convites) bloqueia a exclusão (on delete restrict).
create table public.permissoes_visualizacao (
  area_id          bigint not null references public.areas (id) on delete cascade,
  pode_ver_area_id bigint not null references public.areas (id) on delete cascade,
  primary key (area_id, pode_ver_area_id)
);

-- Índices nas chaves estrangeiras mais consultadas
create index on public.lideres (area_id);
create index on public.eventos (data);
create index on public.eventos (area_id);
create index on public.itens_programa (evento_id);
create index on public.itens_programa (area_id);
-- No máximo um lembrete de cada tipo por evento
create unique index itens_programa_lembrete_unico on public.itens_programa (evento_id, lembrete) where lembrete is not null;
create index on public.musicas (evento_id);
create index on public.musicas (area_id);
create index on public.escalas (evento_id);
create index on public.escalas (area_id);
create index on public.anotacoes_area (area_id);
create index on public.materiais (evento_id);
create index on public.materiais (area_id);
create index on public.recorrencias (area_id);
create unique index eventos_recorrencia_data on public.eventos (recorrencia_id, data) where recorrencia_id is not null;
create index on public.reunioes (data);
create index on public.respostas_reuniao (lider_id);
create index on public.escalas_dispensadas (area_id);


-- ---------------------------------------------------------------------
-- 2. FUNÇÕES AUXILIARES (usadas pelas políticas RLS)
--    security definer: leem "lideres" sem cair na própria RLS.
-- ---------------------------------------------------------------------

create or replace function public.eh_lider()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lideres where id = auth.uid());
$$;

create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lideres where id = auth.uid() and papel = 'admin');
$$;

create or replace function public.minha_area()
returns bigint language sql stable security definer set search_path = '' as $$
  select area_id from public.lideres where id = auth.uid();
$$;

-- Admin vê tudo. Líder vê a própria área + as liberadas na tabela de permissões.
create or replace function public.pode_ver_area(alvo bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lideres l
    where l.id = auth.uid()
      and (
        l.papel = 'admin'
        or l.area_id = alvo
        or exists (
          select 1 from public.permissoes_visualizacao p
          where p.area_id = l.area_id and p.pode_ver_area_id = alvo
        )
      )
  );
$$;

-- Admin edita tudo. Líder edita só a própria área.
create or replace function public.pode_editar_area(alvo bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lideres l
    where l.id = auth.uid()
      and (l.papel = 'admin' or l.area_id = alvo)
  );
$$;


-- Repertório: o Louvor cadastra e ordena; Dança e Audiovisual consultam; o ADM gerencia.
create or replace function public.pode_ver_repertorio()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lideres l left join public.areas a on a.id = l.area_id
    where l.id = auth.uid()
      and (l.papel = 'admin' or lower(a.nome) like '%louvor%' or lower(a.nome) like 'dan_a%' or lower(a.nome) = 'audiovisual')
  );
$$;
create or replace function public.pode_gerenciar_repertorio(alvo bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lideres l left join public.areas a on a.id = l.area_id
    where l.id = auth.uid()
      and (l.papel = 'admin' or (l.area_id = alvo and lower(a.nome) like '%louvor%'))
  );
$$;


-- ---------------------------------------------------------------------
-- 3. FUNÇÕES CHAMADAS PELO APP (rpc)
-- ---------------------------------------------------------------------

-- Liga o usuário logado ao convite com o mesmo e-mail (só e-mail confirmado).
-- Retorna true se a pessoa já é ou acabou de virar líder.
create or replace function public.aceitar_convite()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_conv  public.convites_lideres%rowtype;
begin
  if v_uid is null then
    return false;
  end if;

  if exists (select 1 from public.lideres where id = v_uid) then
    return true;
  end if;

  select lower(u.email) into v_email
  from auth.users u
  where u.id = v_uid and u.email_confirmed_at is not null;

  if v_email is null then
    return false;
  end if;

  select * into v_conv from public.convites_lideres where email = v_email;
  if not found then
    return false;
  end if;

  insert into public.lideres (id, nome, email, area_id, papel)
  values (v_uid, v_conv.nome, v_email, v_conv.area_id, v_conv.papel);

  delete from public.convites_lideres where email = v_email;
  return true;
end;
$$;

-- O app chama ao abrir: grava a hora do acesso do próprio líder.
create or replace function public.registrar_acesso()
returns void language sql security definer set search_path = '' as $$
  update public.lideres set ultimo_acesso = now() where id = auth.uid();
$$;

-- Painel do admin: última vez que cada líder abriu o app e último login.
create or replace function public.acessos_lideres()
returns table (id uuid, nome text, email text, papel text, area_id bigint, ultimo_acesso timestamptz, ultimo_login timestamptz)
language sql stable security definer set search_path = '' as $$
  select l.id, l.nome, l.email, l.papel, l.area_id,
         greatest(l.ultimo_acesso, u.last_sign_in_at),
         u.last_sign_in_at
  from public.lideres l
  join auth.users u on u.id = l.id
  where public.eh_admin()
  order by 6 desc nulls last, l.nome;
$$;

-- Admin cadastra um líder com e-mail e senha inicial (sem service_role).
-- Cria a conta no Supabase Auth já confirmada e o registro em "lideres".
create or replace function public.criar_lider(p_email text, p_senha text, p_nome text, p_area_id bigint, p_papel text default 'lider')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
  v_inst  uuid := coalesce((select instance_id from auth.users limit 1), '00000000-0000-0000-0000-000000000000'::uuid);
begin
  if not public.eh_admin() then raise exception 'Só o administrador pode cadastrar líderes.'; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'E-mail inválido.'; end if;
  if length(coalesce(p_senha, '')) < 6 then raise exception 'A senha inicial precisa ter pelo menos 6 caracteres.'; end if;
  if p_papel not in ('admin', 'lider') then raise exception 'Papel inválido.'; end if;
  if p_papel = 'lider' and p_area_id is null then raise exception 'Escolha o ministério do líder.'; end if;
  if coalesce(trim(p_nome), '') = '' then raise exception 'Informe o nome do líder.'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then raise exception 'Já existe uma conta com este e-mail.'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values (v_inst, v_uid, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_senha, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_uid, v_uid::text,
    jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true), 'email', now(), now(), now());

  insert into public.lideres (id, nome, email, area_id, papel) values (v_uid, trim(p_nome), v_email, p_area_id, p_papel);
  return v_uid;
end;
$$;

-- Admin define uma nova senha para um líder.
create or replace function public.definir_senha_lider(p_id uuid, p_senha text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_admin() then raise exception 'Só o administrador pode trocar a senha de um líder.'; end if;
  if length(coalesce(p_senha, '')) < 6 then raise exception 'A senha precisa ter pelo menos 6 caracteres.'; end if;
  if not exists (select 1 from public.lideres where id = p_id) then raise exception 'Líder não encontrado.'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')), updated_at = now() where id = p_id;
end;
$$;

-- Só o administrador troca senhas. Líder não troca a própria senha (nem pelo app, nem pela API):
-- a trava abaixo recusa a troca quando ela vem do serviço de login do Supabase (supabase_auth_admin)
-- para uma conta que não é de administrador. O "Redefinir senha" do admin passa por definir_senha_lider.
create or replace function public.eh_admin_id(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lideres where id = p_id and papel = 'admin');
$$;
revoke execute on function public.eh_admin_id(uuid) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.eh_admin_id(uuid) to supabase_auth_admin;

create or replace function public.bloquear_troca_senha_lider()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password
     and current_user = 'supabase_auth_admin'
     and not public.eh_admin_id(new.id) then
    raise exception 'Só o administrador pode trocar senhas.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.bloquear_troca_senha_lider() from public, anon, authenticated;
create trigger trg_bloquear_troca_senha_lider
before update of encrypted_password on auth.users
for each row execute function public.bloquear_troca_senha_lider();

-- Admin remove um líder (apaga a conta de login; as escalas continuam).
create or replace function public.remover_lider(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_admin() then raise exception 'Só o administrador pode remover líderes.'; end if;
  if p_id = auth.uid() then raise exception 'Você não pode remover a si mesmo.'; end if;
  if not exists (select 1 from public.lideres where id = p_id) then raise exception 'Líder não encontrado.'; end if;
  delete from auth.users where id = p_id;
end;
$$;

-- Cria as ocorrências dos eventos semanais até a data pedida (o app chama ao abrir o calendário).
create or replace function public.gerar_ocorrencias(p_ate date)
returns integer language plpgsql security definer set search_path = '' as $$
declare r record; v_ate date; v_fim date; v_ini date; n integer := 0; k integer;
begin
  if auth.uid() is not null and not public.eh_lider() then return 0; end if;
  v_ate := least(p_ate, current_date + 400);
  for r in select * from public.recorrencias
           where ativa and cardinality(dias) > 0 and coalesce(gerado_ate, inicio - 1) < least(v_ate, coalesce(fim, v_ate))
           for update skip locked loop
    v_fim := least(v_ate, coalesce(r.fim, v_ate));
    v_ini := greatest(r.inicio, coalesce(r.gerado_ate + 1, r.inicio));
    insert into public.eventos (data, horario, titulo, tipo, area_id, observacoes, recorrencia_id, criado_por)
    select g::date, r.horario, r.titulo, r.tipo, r.area_id, r.observacoes, r.id, r.criado_por
    from generate_series(v_ini, v_fim, interval '1 day') g
    where extract(dow from g)::smallint = any (r.dias) and not (g::date = any (r.pulos))
    on conflict (recorrencia_id, data) where recorrencia_id is not null do nothing;
    get diagnostics k = row_count;
    n := n + k;
    update public.recorrencias set gerado_ate = v_fim where id = r.id;
  end loop;
  return n;
end;
$$;

-- Depois que o ADM edita um evento semanal: atualiza as próximas datas pendentes,
-- tira as que não valem mais (sem escala, música, material ou item) e cria as novas.
create or replace function public.aplicar_recorrencia(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.recorrencias;
begin
  if not public.eh_admin() then raise exception 'permission denied'; end if;
  select * into r from public.recorrencias where id = p_id;
  if not found then return; end if;
  delete from public.eventos e
  where e.recorrencia_id = p_id and e.data >= current_date and e.concluido_em is null and not e.avulso
    and (not r.ativa or not (extract(dow from e.data)::smallint = any (r.dias)) or e.data < r.inicio
         or (r.fim is not null and e.data > r.fim) or e.data = any (r.pulos))
    and not exists (select 1 from public.escalas s where s.evento_id = e.id)
    and not exists (select 1 from public.musicas m where m.evento_id = e.id)
    and not exists (select 1 from public.materiais x where x.evento_id = e.id)
    and not exists (select 1 from public.itens_programa i where i.evento_id = e.id and i.lembrete is null);
  update public.eventos
     set titulo = r.titulo, horario = r.horario, tipo = r.tipo, area_id = r.area_id, observacoes = r.observacoes
   where recorrencia_id = p_id and data >= current_date and concluido_em is null and not avulso;
  if r.ativa then
    update public.recorrencias set gerado_ate = current_date - 1 where id = p_id;
    perform public.gerar_ocorrencias(greatest(current_date, r.inicio) + 56);
  end if;
end;
$$;

-- "Só este evento" ao editar: a data original não volta a ser criada e a série não sobrescreve esta ocorrência
create or replace function public.marcar_avulso(p_evento bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare e public.eventos;
begin
  if not public.eh_admin() then raise exception 'permission denied'; end if;
  select * into e from public.eventos where id = p_evento;
  if not found or e.recorrencia_id is null then return; end if;
  update public.recorrencias set pulos = array_append(pulos, e.data)
   where id = e.recorrencia_id and not (e.data = any (pulos));
  update public.eventos set avulso = true where id = p_evento;
end;
$$;

-- "Só este evento" ao excluir: apaga esta data e ela não volta a ser criada
create or replace function public.excluir_ocorrencia(p_evento bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare e public.eventos;
begin
  if not public.eh_admin() then raise exception 'permission denied'; end if;
  select * into e from public.eventos where id = p_evento;
  if not found then return; end if;
  if e.recorrencia_id is not null then
    update public.recorrencias set pulos = array_append(pulos, e.data)
     where id = e.recorrencia_id and not (e.data = any (pulos));
  end if;
  delete from public.eventos where id = p_evento;
end;
$$;

-- "Este e os próximos" ao editar: a série antiga termina antes desta data e começa uma nova com os dados novos
create or replace function public.editar_serie(p_evento bigint, p_titulo text, p_data date, p_horario time, p_tipo text, p_area_id bigint, p_observacoes text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare e public.eventos; r public.recorrencias; v_nova bigint; v_dow smallint := extract(dow from p_data)::smallint;
begin
  if not public.eh_admin() then raise exception 'permission denied'; end if;
  select * into e from public.eventos where id = p_evento;
  if not found or e.recorrencia_id is null then raise exception 'Este evento não faz parte de um evento semanal.'; end if;
  select * into r from public.recorrencias where id = e.recorrencia_id for update;
  insert into public.recorrencias (titulo, tipo, dias, horario, area_id, observacoes, ativa, inicio, fim, pulos, criado_por)
  values (p_titulo, p_tipo, array[v_dow], p_horario, p_area_id, p_observacoes, true, p_data, r.fim,
          array(select x from unnest(r.pulos) x where x >= p_data), auth.uid())
  returning id into v_nova;
  update public.recorrencias set fim = e.data - 1 where id = r.id;
  update public.eventos
     set recorrencia_id = v_nova, data = p_data, titulo = p_titulo, horario = p_horario,
         tipo = p_tipo, area_id = p_area_id, observacoes = p_observacoes, avulso = false
   where id = p_evento;
  -- próximas datas pendentes: as vazias saem (a nova série recria); as que já têm conteúdo ficam, com os dados novos
  delete from public.eventos x
   where x.recorrencia_id = r.id and x.data > e.data and x.concluido_em is null
     and not exists (select 1 from public.escalas s where s.evento_id = x.id)
     and not exists (select 1 from public.musicas m where m.evento_id = x.id)
     and not exists (select 1 from public.materiais t where t.evento_id = x.id)
     and not exists (select 1 from public.itens_programa i where i.evento_id = x.id and i.lembrete is null);
  update public.eventos x
     set recorrencia_id = v_nova, titulo = p_titulo, horario = p_horario, tipo = p_tipo,
         area_id = p_area_id, observacoes = p_observacoes,
         avulso = (extract(dow from x.data)::smallint <> v_dow)
   where x.recorrencia_id = r.id and x.data > e.data and x.concluido_em is null;
  if not exists (select 1 from public.eventos where recorrencia_id = r.id) then
    delete from public.recorrencias where id = r.id;
  end if;
  perform public.gerar_ocorrencias(greatest(current_date, p_data) + 56);
  return v_nova;
end;
$$;

-- "Este e os próximos" ao excluir: apaga esta data e as próximas pendentes; a série termina antes desta data
create or replace function public.encerrar_serie(p_evento bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare e public.eventos;
begin
  if not public.eh_admin() then raise exception 'permission denied'; end if;
  select * into e from public.eventos where id = p_evento;
  if not found or e.recorrencia_id is null then raise exception 'Este evento não faz parte de um evento semanal.'; end if;
  perform 1 from public.recorrencias where id = e.recorrencia_id for update;
  update public.recorrencias set fim = e.data - 1 where id = e.recorrencia_id;
  delete from public.eventos where recorrencia_id = e.recorrencia_id and data >= e.data and concluido_em is null;
  if not exists (select 1 from public.eventos where recorrencia_id = e.recorrencia_id) then
    delete from public.recorrencias where id = e.recorrencia_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. GATILHOS
-- ---------------------------------------------------------------------

-- Não deixa remover nem rebaixar o último admin.
create or replace function public.proteger_ultimo_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.papel = 'admin' and (tg_op = 'DELETE' or new.papel <> 'admin') then
    if not exists (
      select 1 from public.lideres where papel = 'admin' and id <> old.id
    ) then
      raise exception 'Não é possível remover o último administrador.';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger trg_proteger_ultimo_admin
before update or delete on public.lideres
for each row execute function public.proteger_ultimo_admin();

-- Atualiza a data da anotação a cada edição.
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger trg_anotacoes_atualizado_em
before update on public.anotacoes_area
for each row execute function public.tocar_atualizado_em();

-- E-mail do convite sempre em minúsculas.
create or replace function public.normalizar_email_convite()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

create trigger trg_normalizar_email_convite
before insert or update on public.convites_lideres
for each row execute function public.normalizar_email_convite();

-- Último domingo do mês? (domingo cuja semana seguinte já é outro mês)
create or replace function public.eh_ultimo_domingo(d date)
returns boolean language sql immutable set search_path = '' as $$
  select extract(dow from d) = 0 and extract(month from d + 7) <> extract(month from d);
$$;

-- Culto no último domingo do mês: põe "Aniversariantes" no fim do programa,
-- como lembrete para o Audiovisual, uma só vez. Se a data ou o tipo mudar
-- e deixar de ser último domingo, o lembrete sai.
create or replace function public.lembrete_aniversariantes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_area bigint;
begin
  if new.tipo = 'culto' and public.eh_ultimo_domingo(new.data) then
    select id into v_area from public.areas where lower(nome) = 'audiovisual' limit 1;
    if v_area is not null then
      insert into public.itens_programa (evento_id, area_id, ordem, titulo, tipo, lembrete)
      values (new.id, v_area, 9999, 'Aniversariantes', 'aviso', 'aniversariantes')
      on conflict (evento_id, lembrete) where lembrete is not null do nothing;
    end if;
  else
    delete from public.itens_programa where evento_id = new.id and lembrete = 'aniversariantes';
  end if;
  return new;
end;
$$;

create trigger trg_lembrete_aniversariantes
after insert or update of data, tipo on public.eventos
for each row execute function public.lembrete_aniversariantes();
-- Só o gatilho usa esta função; o app não a chama
revoke execute on function public.lembrete_aniversariantes() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. RLS — LIGADA EM TODAS AS TABELAS
-- ---------------------------------------------------------------------

alter table public.areas                   enable row level security;
alter table public.lideres                 enable row level security;
alter table public.convites_lideres        enable row level security;
alter table public.membros                 enable row level security;
alter table public.eventos                 enable row level security;
alter table public.itens_programa          enable row level security;
alter table public.musicas                 enable row level security;
alter table public.escalas                 enable row level security;
alter table public.anotacoes_area          enable row level security;
alter table public.permissoes_visualizacao enable row level security;
alter table public.materiais               enable row level security;
alter table public.recorrencias            enable row level security;
alter table public.reunioes                enable row level security;
alter table public.respostas_reuniao       enable row level security;
alter table public.escalas_dispensadas     enable row level security;

-- areas: todo líder lê; só admin altera
create policy areas_ler on public.areas
  for select to authenticated using ((select public.eh_lider()));
create policy areas_admin_inserir on public.areas
  for insert to authenticated with check ((select public.eh_admin()));
create policy areas_admin_alterar on public.areas
  for update to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));
create policy areas_admin_apagar on public.areas
  for delete to authenticated using ((select public.eh_admin()));

-- lideres: cada um lê o próprio registro; admin lê e altera todos.
-- Ninguém se cadastra como líder sozinho (só via aceitar_convite).
create policy lideres_ler on public.lideres
  for select to authenticated using (id = (select auth.uid()) or (select public.eh_admin()));
create policy lideres_admin_alterar on public.lideres
  for update to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));
create policy lideres_admin_apagar on public.lideres
  for delete to authenticated using ((select public.eh_admin()));

-- convites: só admin
create policy convites_admin on public.convites_lideres
  for all to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));

-- membros: cadastro geral da igreja, só admin
create policy membros_admin on public.membros
  for all to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));

-- eventos: todo líder vê; só o admin cria, edita, apaga e conclui
create policy eventos_ler on public.eventos
  for select to authenticated using ((select public.eh_lider()));
create policy eventos_admin_inserir on public.eventos
  for insert to authenticated with check ((select public.eh_admin()));
create policy eventos_admin_alterar on public.eventos
  for update to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));
create policy eventos_admin_apagar on public.eventos
  for delete to authenticated using ((select public.eh_admin()));

-- itens_programa, musicas, escalas: vê conforme permissão, edita só a própria área
create policy itens_ler on public.itens_programa
  for select to authenticated using (public.pode_ver_area(area_id));
create policy itens_inserir on public.itens_programa
  for insert to authenticated with check (public.pode_editar_area(area_id));
create policy itens_alterar on public.itens_programa
  for update to authenticated using (public.pode_editar_area(area_id)) with check (public.pode_editar_area(area_id));
create policy itens_apagar on public.itens_programa
  for delete to authenticated using (public.pode_editar_area(area_id));

-- musicas (repertório): Louvor, Dança, Audiovisual e admin leem; Louvor e admin gerenciam
create policy musicas_ler on public.musicas
  for select to authenticated using ((select public.pode_ver_repertorio()));
create policy musicas_inserir on public.musicas
  for insert to authenticated with check (public.pode_gerenciar_repertorio(area_id));
create policy musicas_alterar on public.musicas
  for update to authenticated using (public.pode_gerenciar_repertorio(area_id)) with check (public.pode_gerenciar_repertorio(area_id));
create policy musicas_apagar on public.musicas
  for delete to authenticated using (public.pode_gerenciar_repertorio(area_id));

create policy escalas_ler on public.escalas
  for select to authenticated using (public.pode_ver_area(area_id));
create policy escalas_inserir on public.escalas
  for insert to authenticated with check (public.pode_editar_area(area_id));
create policy escalas_alterar on public.escalas
  for update to authenticated using (public.pode_editar_area(area_id)) with check (public.pode_editar_area(area_id));
create policy escalas_apagar on public.escalas
  for delete to authenticated using (public.pode_editar_area(area_id));

-- anotacoes_area: só a própria área e o admin (ignora a tabela de permissões)
create policy anotacoes_area on public.anotacoes_area
  for all to authenticated using (public.pode_editar_area(area_id)) with check (public.pode_editar_area(area_id));

-- materiais: vê quem pode ver o ministério que enviou; envia e apaga o próprio ministério (ou o admin)
create policy materiais_ler on public.materiais
  for select to authenticated using (public.pode_ver_area(area_id));
create policy materiais_inserir on public.materiais
  for insert to authenticated with check (public.pode_editar_area(area_id) and enviado_por = (select auth.uid()));
create policy materiais_apagar on public.materiais
  for delete to authenticated using (public.pode_editar_area(area_id));

-- recorrencias: todo líder lê; só o admin altera
create policy recorrencias_ler on public.recorrencias
  for select to authenticated using ((select public.eh_lider()));
create policy recorrencias_admin on public.recorrencias
  for all to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));

-- reuniões: todo líder lê; só o admin agenda, edita e apaga
create policy reunioes_ler on public.reunioes
  for select to authenticated using ((select public.eh_lider()));
create policy reunioes_admin on public.reunioes
  for all to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));

-- respostas: cada líder vê e grava só a própria; o admin vê todas
create policy respostas_ler on public.respostas_reuniao
  for select to authenticated using (lider_id = (select auth.uid()) or (select public.eh_admin()));
create policy respostas_inserir on public.respostas_reuniao
  for insert to authenticated with check (lider_id = (select auth.uid()) and (select public.eh_lider()));
create policy respostas_alterar on public.respostas_reuniao
  for update to authenticated using (lider_id = (select auth.uid())) with check (lider_id = (select auth.uid()));
create policy respostas_apagar on public.respostas_reuniao
  for delete to authenticated using (lider_id = (select auth.uid()) or (select public.eh_admin()));

-- escalas_dispensadas: vê quem pode ver as escalas daquele ministério; marca e desfaz o próprio ministério (ou o admin)
create policy dispensas_ler on public.escalas_dispensadas
  for select to authenticated using (public.pode_ver_area(area_id));
create policy dispensas_inserir on public.escalas_dispensadas
  for insert to authenticated with check (public.pode_editar_area(area_id) and dispensado_por = (select auth.uid()));
create policy dispensas_apagar on public.escalas_dispensadas
  for delete to authenticated using (public.pode_editar_area(area_id));

-- permissoes_visualizacao: líder lê as da própria área; admin lê e edita todas
create policy permissoes_ler on public.permissoes_visualizacao
  for select to authenticated using ((select public.eh_admin()) or area_id = (select public.minha_area()));
create policy permissoes_admin_inserir on public.permissoes_visualizacao
  for insert to authenticated with check ((select public.eh_admin()));
create policy permissoes_admin_alterar on public.permissoes_visualizacao
  for update to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));
create policy permissoes_admin_apagar on public.permissoes_visualizacao
  for delete to authenticated using ((select public.eh_admin()));


-- ---------------------------------------------------------------------
-- 6. PRIVILÉGIOS
--    anon (sem login) não acessa nada. authenticated passa pela RLS.
-- ---------------------------------------------------------------------

revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke execute on function
  public.eh_lider(), public.eh_admin(), public.minha_area(),
  public.pode_ver_area(bigint), public.pode_editar_area(bigint),
  public.pode_ver_repertorio(), public.pode_gerenciar_repertorio(bigint),
  public.aceitar_convite(),
  public.registrar_acesso(), public.acessos_lideres(),
  public.criar_lider(text, text, text, bigint, text), public.definir_senha_lider(uuid, text), public.remover_lider(uuid),
  public.gerar_ocorrencias(date), public.aplicar_recorrencia(bigint),
  public.marcar_avulso(bigint), public.excluir_ocorrencia(bigint),
  public.editar_serie(bigint, text, date, time, text, bigint, text), public.encerrar_serie(bigint)
from public, anon;

grant execute on function
  public.eh_lider(), public.eh_admin(), public.minha_area(),
  public.pode_ver_area(bigint), public.pode_editar_area(bigint),
  public.pode_ver_repertorio(), public.pode_gerenciar_repertorio(bigint),
  public.aceitar_convite(),
  public.registrar_acesso(), public.acessos_lideres(),
  public.criar_lider(text, text, text, bigint, text), public.definir_senha_lider(uuid, text), public.remover_lider(uuid),
  public.gerar_ocorrencias(date), public.aplicar_recorrencia(bigint),
  public.marcar_avulso(bigint), public.excluir_ocorrencia(bigint),
  public.editar_serie(bigint, text, date, time, text, bigint, text), public.encerrar_serie(bigint)
to authenticated;

-- Funções de gatilho não devem ser chamadas diretamente pela API.
revoke execute on function
  public.proteger_ultimo_admin(), public.tocar_atualizado_em(), public.normalizar_email_convite()
from public, anon, authenticated;


-- ---------------------------------------------------------------------
-- 6b. STORAGE: pasta privada "materiais" (só áudio e vídeo, até 50 MB por arquivo)
--     As regras conferem o ministério pelo caminho <evento>/<ministério>/<arquivo>.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materiais', 'materiais', false, 52428800, array['audio/*', 'video/*'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.area_do_caminho(p_nome text)
returns bigint language sql immutable set search_path = '' as $$
  select case when split_part(p_nome, '/', 2) ~ '^[0-9]+$' then split_part(p_nome, '/', 2)::bigint end;
$$;
revoke execute on function public.area_do_caminho(text) from public, anon;
grant execute on function public.area_do_caminho(text) to authenticated;

create policy materiais_storage_ler on storage.objects
  for select to authenticated using (bucket_id = 'materiais' and public.pode_ver_area(public.area_do_caminho(name)));
create policy materiais_storage_enviar on storage.objects
  for insert to authenticated with check (bucket_id = 'materiais' and public.pode_editar_area(public.area_do_caminho(name)));
create policy materiais_storage_apagar on storage.objects
  for delete to authenticated using (bucket_id = 'materiais' and public.pode_editar_area(public.area_do_caminho(name)));


-- ---------------------------------------------------------------------
-- 7. REALTIME (incluído no plano gratuito; respeita a RLS)
-- ---------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime
      add table public.eventos, public.itens_programa, public.musicas, public.escalas, public.materiais,
                public.reunioes, public.respostas_reuniao, public.escalas_dispensadas;
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- 8. DADOS INICIAIS
-- ---------------------------------------------------------------------

insert into public.areas (nome) values
  ('Diáconos'), ('Música (Louvor)'), ('Dança'), ('Teatro'), ('Casais'), ('Juventude Básico'), ('Kids'),
  ('Alma (mulheres)'), ('Rosh (homens)'), ('Jiu-Jitsu'), ('Mídia'), ('Recepção'), ('Audiovisual')
on conflict (nome) do nothing;

-- Visualização das escalas (configuração atual desta igreja). A própria área é
-- sempre visível, mas fica registrada para aparecer marcada na tela do admin.
insert into public.permissoes_visualizacao (area_id, pode_ver_area_id)
select a.id, b.id
from public.areas a
join public.areas b on
     a.id = b.id
  or (a.nome = 'Dança'       and b.nome in ('Música (Louvor)', 'Audiovisual'))
  or (a.nome = 'Audiovisual' and b.nome in ('Música (Louvor)', 'Dança', 'Teatro', 'Mídia'))
  or (a.nome = 'Teatro'      and b.nome = 'Audiovisual')
  or (a.nome = 'Mídia'       and b.nome in ('Dança', 'Teatro'))
on conflict do nothing;

-- Eventos semanais desta igreja: Culto de domingo (domingo, 19h), Escola Talmidim (terça, 19h30)
-- e Jiu-Jitsu (segunda e quarta, pendente até confirmar o horário)
insert into public.recorrencias (titulo, tipo, dias, horario, area_id, ativa) values
  ('Culto de domingo', 'culto', '{0}', '19:00', null, true),
  ('Escola Talmidim', 'aula', '{2}', '19:30', null, true),
  ('Jiu-Jitsu', 'aula', '{1,3}', null, (select id from public.areas where nome = 'Jiu-Jitsu'), false);


-- ---------------------------------------------------------------------
-- 9. PRIMEIRO ADMIN
--    1) Crie a sua conta em Authentication › Users › Add user › Create new user
--       (marque "Auto Confirm User").
--    2) Troque o e-mail e o nome abaixo, descomente e rode. Ao entrar no app com
--       esse e-mail e senha, o app chama aceitar_convite() e você vira admin.
--    Os demais líderes o admin cadastra pelo próprio app (Admin › Líderes).
-- ---------------------------------------------------------------------

-- insert into public.convites_lideres (email, nome, area_id, papel)
-- values ('seu-email@exemplo.com', 'Seu Nome', null, 'admin');
