# Qhall — App da Igreja

Site gratuito para organizar cultos, ensaios e reuniões: calendário, programa, músicas, escalas, anotações por área e visão para o telão. Funciona no celular e pode ser instalado na tela inicial (PWA).

- **Custo zero:** Supabase (plano gratuito) + GitHub Pages.
- **Sem build:** HTML, CSS e JavaScript puros. Basta subir os arquivos.
- **Segurança no banco:** todas as regras ficam no Supabase (RLS). Esconder um botão na tela não é o que protege; o banco recusa o que não é permitido.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `banco.sql` | Tabelas, áreas iniciais, permissões e regras de segurança (RLS). Roda uma vez no Supabase. |
| `index.html` | Página única do app. |
| `app.js` | Toda a lógica. **Aqui você cola a URL e a chave anon.** |
| `estilo.css` | Visual Qhall: identidade escura, barra lateral no PC, menu inferior no celular, calendário com divisórias e vidro discreto nos botões e janelas. |
| `manifest.json` e `sw.js` | Instalação como app (PWA). |
| `icone-180.png`, `icone-192.png`, `icone-512.png` | Ícones do app (iPhone e Android). |

## Projeto Supabase desta igreja (já configurado)

- **Projeto:** `igreja`, organização `Igreja`, plano **Free**, região São Paulo.
- **URL:** `https://khfneqgyaxsmhrqparwt.supabase.co` (já está no `app.js`, com a chave **publishable**, que é pública).
- **Banco:** versão 8.2 (migrações v8, v8.1 e v8.2 aplicadas sobre a v7, preservando os dados e as permissões de escala). RLS em todas as tabelas, Realtime ligado.
- **Storage:** pasta privada `materiais` (só áudio e vídeo, até 50 MB por arquivo; o plano gratuito tem 1 GB no total).
- **Contas atuais:** 1 admin (Davi) e 2 líderes de teste (Audiovisual e Música/Louvor). Faltam as contas de ADM da mãe e do pai do Davi, do Elan e do Fabrício (seção 8). Os dados de teste foram apagados.
- **Endereços de login liberados:** `https://hokimofi.github.io/qhall/` (site publicado), `http://localhost:8124` e `http://127.0.0.1:8124` (testes no computador).
- **Site publicado (GitHub Pages):** <https://hokimofi.github.io/qhall/>, a partir do repositório `Hokimofi/qhall` (branch `main`, pasta raiz). Para atualizar: `git push` na branch `main`; o site muda em cerca de 1 minuto.
- **Instalar no celular:** abra o endereço no Chrome (Android: ⋮ › Adicionar à tela inicial) ou no Safari (iPhone: Compartilhar › Adicionar à Tela de Início). Não há arquivo para baixar.
- **Supabase liberado para o site (21/11/2026):** em **Authentication › URL Configuration**, o **Site URL** é `https://hokimofi.github.io/qhall/` e `https://hokimofi.github.io/qhall/**` está nas Redirect URLs, então o link de "Esqueci a senha" volta para o site publicado.
- A senha do banco foi gerada pelo Supabase e não é usada pelo app. Se precisar dela, redefina em **Project Settings › Database**.

## Como funciona o acesso

- **Login:** só e-mail e senha. Não existe cadastro aberto no app: o **admin cadastra o líder** (nome, e-mail, senha inicial e ministério) e passa a senha em particular. O líder pode trocá-la em **Alterar senha**, no menu com o nome dele (canto superior direito). "Esqueci a senha" envia um link por e-mail.
- Só **líderes** entram no app. Membros da equipe não têm login.
- **ADM:** cinco contas individuais de administrador: Davi, mãe do Davi, pai do Davi, Elan e Fabrício. Os pais do Davi têm o acesso pastoral pela própria conta de ADM. O ADM vê e edita tudo: eventos, eventos semanais, reuniões, escalas de todos os ministérios, repertório, membros, ministérios, permissões, anotações e o painel de acessos.
- **Líder (base igual para todos, inclusive Jiu-Jitsu):** consulta o calendário, monta a escala do próprio ministério num evento que já existe (e edita depois), adiciona itens da própria equipe ao programa, envia materiais e responde às reuniões. Vê as escalas de outros ministérios conforme a tela de permissões.
- **Eventos oficiais (inclusive os de domingo):** só o ADM cria, edita, exclui ou conclui. A regra está no app e no Supabase (RLS).

**Calendário**

- Duas visões: **Semana** e **Mês**. Os líderes abrem em **Semana**; o ADM abre em **Mês** (onde fica a lista de concluídos). A troca é pelo botão no topo.
- **Semana:** de segunda a domingo, com o intervalo real no cabeçalho (ex.: "23 a 29 de novembro", "30 de novembro a 6 de dezembro") e setas para voltar ou avançar uma semana. Em cada dia, os eventos e reuniões em ordem de horário.
- **Mês:** grade de domingo a sábado; tocar num dia mostra logo abaixo os eventos daquela data. Abaixo, **Próximos eventos** e **Concluídos neste mês**.
- Bolinhas: **vermelha** = evento pendente, **verde** = concluído, **roxa** = evento semanal, **amarela** = reunião.
- **Eventos semanais agrupados:** nas listas, as datas dos eventos semanais ficam numa seção recolhível **Eventos semanais**, com uma linha por série (cadastro da série: título, "Toda terça às 19h30", quantas datas e quantas pendentes). Ao abrir uma série, aparecem as datas do período exibido (a semana ou o mês), cada uma com escala, repertório, materiais e situação próprios; o ADM conclui pela bolinha de cada data. Na Semana, o dia avisa "1 evento semanal (em Eventos semanais, abaixo)". No Mês, as bolinhas continuam na grade e, ao tocar num dia, todas as datas daquele dia (inclusive as semanais) aparecem logo abaixo.
- Séries com o mesmo título continuam separadas (ex.: duas séries "Escola Talmidim" com horários diferentes aparecem em duas linhas). O app não junta séries nem muda horários sozinho.
- Só o ADM tem **+ Evento** e **Importar eventos** (seção 15).

**+ Evento** (ADM)

- **Tipo Reunião:** o formulário troca Ministério por **Local** e Observações por **Pauta**. Ao salvar, a reunião é gravada uma vez só, na mesma tabela da aba **Reuniões**: aparece no calendário com bolinha amarela e na aba Reuniões, onde os líderes respondem Vou ou Não vou e o ADM acompanha.
- **Repetir toda semana:** antes de salvar aparece a prévia (ex.: "Todo domingo às 19h"). Ao salvar, vira um evento semanal com bolinha roxa; cada data é um evento próprio, com escala, repertório, materiais e conclusão separados. A data precisa ser hoje ou futura.
- **Editar ou excluir uma data de evento semanal:** o app pergunta **Só este evento** ou **Este e os próximos**.
  - Editar só este: muda só aquela data; as outras e a série continuam iguais.
  - Editar este e os próximos: a série antiga termina antes desta data e começa uma nova com os dados novos. As datas seguintes sem conteúdo são recriadas; as que já têm escala, música, material ou item ficam, com os dados novos.
  - Excluir só este: só aquela data sai (e não volta a ser criada).
  - Excluir este e os próximos: aquela data e as seguintes pendentes saem, com escalas, músicas e materiais. As anteriores e as concluídas ficam.

**Eventos semanais** (ADM, em **Administração › Eventos semanais**)

- O ADM cadastra título, dias da semana, horário, tipo e ministério, e liga ou desliga. Cada semana vira um **evento próprio** no calendário (bolinha roxa e selo "Semanal"), com data, escala e conclusão separadas.
- **Séries atuais:** **Culto de domingo** (todo domingo, 19h) e **Escola Talmidim** (horário oficial: toda terça-feira às 19h30), ligadas. A série antiga da Escola Talmidim às 7h30 foi apagada em 19/11/2026.
- **Jiu-Jitsu:** segunda e quarta, **pendente**: desligado e sem horário até a confirmação. Para ativar: ✎ › horário › marcar **Ativo** › Salvar.
- Mudar um evento semanal vale para as próximas datas ainda não concluídas. Datas que já têm escala, música, material ou item no programa não são apagadas. Datas concluídas ou passadas não mudam.
- As datas são criadas até onde alguém abriu o calendário (até 400 dias à frente).

**Reuniões** (logo abaixo de Calendário no menu)

- O ADM agenda (título, data, horário, local e pauta). Os líderes veem a lista e respondem **Vou** ou **Não vou**; dá para mudar a resposta. Uma resposta por conta de líder.
- As reuniões aparecem no calendário com bolinha amarela.
- O ADM vê em cada reunião quantos **confirmaram**, **recusaram** e estão **sem resposta**, e em **Ver quem respondeu** os nomes de cada grupo.
- No Supabase, cada líder só lê e grava a própria resposta; só o ADM vê todas e agenda reuniões.

**Escalas**

- Em cada evento, o ministério tem **Adicionar escala** / **Editar escala**. A escala é uma lista de linhas com dois campos de texto livre: **Função** e **Quem vai atuar** (ex.: Projeção — Davi, Iluminação — Ana). Dá para adicionar e remover linhas. Se houver duas Anas, escreva o sobrenome.
- Sem ligação com o cadastro de Membros e sem contagem por pessoa.
- O líder gerencia as escalas do próprio ministério; o admin, as de todos. O texto para o WhatsApp continua em **Escala p/ WhatsApp**.
- **Pular escala desta data** (na escala do evento e em **Minha equipe**): pergunta "Marcar esta data como sem escala para sua equipe?". Confirmado, mostra **Sem escala necessária** e a data deixa de ser o destaque de escala pendente da equipe. O evento continua no calendário e a decisão vale só para aquele ministério naquela data. **Desfazer** volta a deixar a escala pendente. Quem pode ver as escalas daquele ministério vê "Sem escala necessária"; o texto do WhatsApp também mostra. Só o próprio ministério (ou o ADM) marca e desfaz.
- Sugestões por ministério: **Diáconos** podem escrever "Todos os diáconos" quando for a equipe toda; **Kids** escala quem vai ajudar na salinha; **Mídia** cuida de fotos e conteúdo para o Instagram; **Audiovisual** cuida de projeção, transmissão e iluminação.
- **Minha equipe** (líder): destaca o próximo evento que ainda precisa de escala da equipe, com **Adicionar escala** / **Editar escala** e **Pular escala desta data**. As datas marcadas como sem escala antes dele aparecem em **Sem escala necessária**, com **Desfazer**. Todos os eventos entram, inclusive os semanais (ex.: Culto de domingo, Escola Talmidim); a equipe pula as datas em que não serve. Para outro evento, o líder abre o evento pelo calendário.

**Ministérios** (só admin)

- Diáconos, Música (Louvor), Dança, Teatro, Casais, Juventude Básico, Kids, Alma (mulheres), Rosh (homens), Jiu-Jitsu, Mídia, Recepção e Audiovisual. O antigo "Louvor" virou "Música (Louvor)", sem duplicar.
- Atalhos para cada ministério. Ao abrir um ministério, o próximo evento aparece em destaque com as funções e os nomes da escala, seguido dos próximos eventos. Dali o admin edita escalas, anotações, renomeia ou apaga o ministério.

**Materiais para o Audiovisual**

- Dentro do evento, logo abaixo de **Escala**, o cartão **Materiais para o Audiovisual** tem o botão **+ Enviar material** para o admin e para os líderes de todos os ministérios (Louvor, Dança, Teatro…). O formulário fica recolhido até o clique.
- Aceita **arquivo de áudio ou vídeo** (até 50 MB) ou **link** (Drive, YouTube…), com o campo opcional **Quando usar?** (ex.: "Após a abertura").
- Cada item mostra o nome, o ministério que enviou e o botão **Baixar** (arquivo) ou **Abrir link**. O Audiovisual encontra tudo dentro do evento para preparar no PC.
- **Proteção no Supabase:** os arquivos ficam numa pasta **privada**. Só baixa quem pode ver o ministério que enviou (o Audiovisual vê todos), por um link temporário de 5 minutos. Envia e apaga o próprio ministério ou o admin. Sem login, nada abre.

**Programa do evento**

- Cada item tem **nome** (ex.: "Dança, após o Louvor") e **horário estimado** opcional. O horário aparece ao lado do item com a palavra **previsto**, porque é uma previsão.
- Nos **cultos do último domingo do mês**, o item **Aniversariantes** entra sozinho no fim do programa, como lembrete para o **Audiovisual** (com o selo "Lembrete do último domingo"). Vale para o culto que já está no calendário e entra uma só vez. Se a data mudar e deixar de ser o último domingo, o lembrete sai.
- Quem vê o lembrete: o admin e os ministérios que podem ver o Audiovisual (pela tela de permissões).

**Concluir evento** (só admin)

- No calendário, cada evento pendente tem uma **bolinha vermelha**. Para o admin, a bolinha é um botão separado: tocar nela abre **"Marcar este evento como concluído?"** ali mesmo, sem sair do calendário.
- Concluído, o evento sai de **Próximos eventos** e vai para **Concluídos neste mês** (recolhido; abre ao tocar no título), com bolinha verde, data, horário e nome levemente riscado. A conclusão fica gravada no Supabase.
- Na grade, o dia tem bolinha **vermelha** se algum evento dele está pendente e **verde** quando todos estão concluídos.
- Os líderes veem as bolinhas, mas não concluem (só o admin edita eventos, também no banco).
- **Reabrir evento** (só ADM): em **Concluídos neste mês**, o botão **⋯** de cada item tem **Reabrir evento**. Pergunta "Voltar este evento para os pendentes?" e, confirmado, grava no Supabase e atualiza o calendário. A lista inclui as datas de eventos semanais (com bolinha roxa); reabrir uma delas reabre só aquela data. Escalas, músicas, programa e materiais ficam como estavam.

**Resumo do evento** (só ADM)

- Na tela do evento, logo abaixo do cabeçalho, o cartão **Resumo do evento** mostra cada ministério como **Escala pronta** (com o número de linhas), **Pendente** ou **Sem escala necessária**, e a contagem de cada situação.
- Mostra também se o Louvor já adicionou o repertório (quantas músicas e as primeiras) e os materiais enviados para o Audiovisual (nome, arquivo ou link, ministério e "quando usar").
- Quando uma equipe usa **Pular escala desta data** ou **Desfazer**, o resumo daquela data muda na hora, só para aquela equipe.

**Músicas do evento**

- O líder do **Louvor** cadastra as músicas (nome e link opcional) na tela do evento e muda a ordem com ↑ ↓. O ADM também gerencia.
- Os líderes de **Dança** e **Audiovisual** consultam o repertório na ordem do Louvor. Os outros ministérios não veem. Essa regra vale no Supabase e não depende da tela de permissões das escalas.

**Membros** (só admin)

- Cadastro geral da igreja, com nomes completos, sem ligação com os ministérios. Abas Cadastro, Lista e Aniversariantes.
- **Copiar lista de aniversariantes** copia todos os nomes do mês escolhido, pronto para colar no WhatsApp.
- Num evento cujo título tenha "Aniversariantes" (ex.: "Culto dos Aniversariantes"), o admin vê a lista do mês da data do evento, com o mesmo botão de copiar.

Visualização das escalas (configuração atual, mantida na v8; o admin muda em **Admin › Permissões**):

| Ministério | Vê as escalas de |
|---|---|
| Música (Louvor) | Música (Louvor) |
| Dança | Dança, Música (Louvor), Audiovisual |
| Audiovisual | Audiovisual, Música (Louvor), Dança, Teatro, Mídia |
| Teatro | Teatro, Audiovisual |
| Mídia | Mídia, Dança, Teatro |
| Diáconos, Casais, Juventude Básico, Kids, Alma, Rosh, Jiu-Jitsu, Recepção | Só o próprio |

O próprio ministério é sempre visível. As anotações de cada ministério são vistas só por ele e pelo admin.

**Exclusão:**

- Apagar um item do programa, uma música ou uma linha da escala apaga só esse registro.
- Apagar um evento (só admin) apaga o evento e o que pertence a ele (programa, músicas e escalas daquele evento).
- Apagar um ministério **vazio** é permitido (**Ministérios › (ministério) › ✎ › Apagar ministério**); as permissões dele saem junto.
- Se o ministério tiver evento, evento semanal, escala, música, item do programa, anotação, líder ou convite, a exclusão é **bloqueada** e o app mostra o motivo (ex.: "ainda tem 1 evento, 3 escalas"). O banco também recusa (`on delete restrict`). Só o admin pode desfazer esses vínculos.
- Apagar um membro do cadastro não mexe em escalas (lá o nome é digitado).
- O banco não deixa remover nem rebaixar o último admin.

---

## 1. Criar o projeto no Supabase

1. Entre em <https://supabase.com> e crie uma conta (gratuita).
2. Clique em **New project**. Escolha um nome (ex.: `igreja`), crie uma senha forte para o banco (guarde em local seguro; o app não usa) e a região **South America (São Paulo)**.
3. Espere o projeto ficar pronto (1 a 2 minutos).

## 2. Rodar o SQL

1. No menu da esquerda, abra **SQL Editor** › **New query**.
2. Copie todo o conteúdo de `banco.sql`, cole e clique em **Run**.
3. Deve aparecer "Success. No rows returned".
4. Confira em **Table Editor**: as tabelas `areas`, `lideres`, `membros`, `eventos` etc. aparecem, e `areas` tem Louvor, Dança, Audiovisual, Teatro e Mídia.

> Rode o arquivo só uma vez, num projeto novo. Se precisar recomeçar, o mais simples é criar outro projeto.

### Já tinha rodado uma versão anterior do `banco.sql`?

Não rode o arquivo inteiro de novo (daria erro de "já existe"). Rode só este trecho no **SQL Editor**. Ele leva um banco da versão 1, 2 ou 3 para a versão 4, **preserva os dados** e pode ser rodado mais de uma vez.

O que ele faz:

- Equipe com conteúdo não pode ser apagada; equipe vazia pode, e as permissões dela saem junto.
- Escalas passam a guardar o nome digitado. As antigas que estavam ligadas a um membro recebem o nome dele, e depois a ligação com o cadastro de membros é removida.
- Membros deixam de ter equipe (cadastro geral da igreja).
- Registra a última vez que cada líder abriu o app.

```sql
-- Migração para a versão 4 (leva um banco da v1, v2 ou v3 para a v4).
-- Preserva os dados. Pode ser rodada mais de uma vez.

-- 1) Equipes: conteúdo bloqueia a exclusão; permissões saem junto
alter table public.convites_lideres drop constraint if exists convites_lideres_area_id_fkey,
  add constraint convites_lideres_area_id_fkey foreign key (area_id) references public.areas (id) on delete restrict;
alter table public.itens_programa drop constraint if exists itens_programa_area_id_fkey,
  add constraint itens_programa_area_id_fkey foreign key (area_id) references public.areas (id) on delete restrict;
alter table public.musicas drop constraint if exists musicas_area_id_fkey,
  add constraint musicas_area_id_fkey foreign key (area_id) references public.areas (id) on delete restrict;
alter table public.escalas drop constraint if exists escalas_area_id_fkey,
  add constraint escalas_area_id_fkey foreign key (area_id) references public.areas (id) on delete restrict;
alter table public.anotacoes_area drop constraint if exists anotacoes_area_area_id_fkey,
  add constraint anotacoes_area_area_id_fkey foreign key (area_id) references public.areas (id) on delete restrict;
alter table public.permissoes_visualizacao drop constraint if exists permissoes_visualizacao_area_id_fkey,
  add constraint permissoes_visualizacao_area_id_fkey foreign key (area_id) references public.areas (id) on delete cascade;
alter table public.permissoes_visualizacao drop constraint if exists permissoes_visualizacao_pode_ver_area_id_fkey,
  add constraint permissoes_visualizacao_pode_ver_area_id_fkey foreign key (pode_ver_area_id) references public.areas (id) on delete cascade;

-- 2) Escalas: nome digitado pelo líder, sem ligação com o cadastro de membros.
--    Escalas antigas ligadas a um membro recebem o nome dele antes de a ligação sair.
alter table public.escalas add column if not exists nome text;
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'escalas' and column_name = 'membro_id') then
    update public.escalas e set nome = m.nome
      from public.membros m
      where e.membro_id = m.id and (e.nome is null or length(trim(e.nome)) = 0);
  end if;
end;
$$;
update public.escalas set nome = '—' where nome is null or length(trim(nome)) = 0;
alter table public.escalas alter column nome set not null;
drop trigger if exists trg_escalas_vinculo_so_admin on public.escalas;
drop function if exists public.escalas_vinculo_so_admin();
alter table public.escalas drop column if exists membro_id;
alter table public.escalas drop constraint if exists escalas_nome_check,
  add constraint escalas_nome_check check (length(trim(nome)) > 0);

-- 3) Membros: cadastro geral da igreja, sem equipe
alter table public.membros drop column if exists area_id;
drop function if exists public.membros_basico();

-- 4) Último acesso ao app
alter table public.lideres add column if not exists ultimo_acesso timestamptz;

create or replace function public.registrar_acesso()
returns void language sql security definer set search_path = '' as $$
  update public.lideres set ultimo_acesso = now() where id = auth.uid();
$$;

drop function if exists public.acessos_lideres();
create function public.acessos_lideres()
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

-- 5) Quem pode chamar
revoke execute on function public.registrar_acesso(), public.acessos_lideres() from public, anon;
grant execute on function public.registrar_acesso(), public.acessos_lideres() to authenticated;
```

### Migração v8.2 — "Pular escala desta data" (aplicada neste projeto em 19/11/2026)

Para um banco que já está na v8.1. Preserva os dados. Cria a tabela `escalas_dispensadas` (um registro por evento e ministério).

```sql
-- "Pular escala desta data": a equipe marca que não precisa de escala naquele evento.
-- Vale só para aquele ministério naquela data; o evento continua no calendário.
create table if not exists public.escalas_dispensadas (
  evento_id      bigint not null references public.eventos (id) on delete cascade,
  area_id        bigint not null references public.areas (id) on delete cascade,
  dispensado_por uuid default auth.uid() references auth.users (id) on delete set null,
  dispensado_em  timestamptz not null default now(),
  primary key (evento_id, area_id)
);
create index if not exists escalas_dispensadas_area_idx on public.escalas_dispensadas (area_id);

alter table public.escalas_dispensadas enable row level security;
drop policy if exists dispensas_ler on public.escalas_dispensadas;
drop policy if exists dispensas_inserir on public.escalas_dispensadas;
drop policy if exists dispensas_apagar on public.escalas_dispensadas;
-- vê quem pode ver as escalas daquele ministério; marca e desfaz o próprio ministério (ou o admin)
create policy dispensas_ler on public.escalas_dispensadas
  for select to authenticated using (public.pode_ver_area(area_id));
create policy dispensas_inserir on public.escalas_dispensadas
  for insert to authenticated with check (public.pode_editar_area(area_id) and dispensado_por = (select auth.uid()));
create policy dispensas_apagar on public.escalas_dispensadas
  for delete to authenticated using (public.pode_editar_area(area_id));

revoke all on public.escalas_dispensadas from anon;
grant select, insert, delete on public.escalas_dispensadas to authenticated;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'escalas_dispensadas') then
    alter publication supabase_realtime add table public.escalas_dispensadas;
  end if;
end $$;
```

### Migração v8.1 — Reunião e "Repetir toda semana" pelo + Evento (aplicada neste projeto em 19/11/2026)

Para um banco que já está na v8. Preserva os dados. Acrescenta o fim e as datas puladas da série, a marca de ocorrência alterada só nela e as funções de "Só este evento" e "Este e os próximos".

```sql
-- 1) Fim da série, datas puladas e ocorrências alteradas só nelas
alter table public.recorrencias add column if not exists fim date;
alter table public.recorrencias add column if not exists pulos date[] not null default '{}';
alter table public.eventos add column if not exists avulso boolean not null default false;

-- 2) Gerar ocorrências respeitando o fim da série e as datas puladas
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

-- 3) Depois que o ADM edita a série: não mexe nas ocorrências alteradas só nelas (avulso)
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

-- 4) "Só este evento" ao editar: a data original não volta a ser criada e a série não sobrescreve esta ocorrência
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

-- 5) "Só este evento" ao excluir: apaga esta data e ela não volta a ser criada
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

-- 6) "Este e os próximos" ao editar: a série antiga termina antes desta data e começa uma nova com os dados novos
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

-- 7) "Este e os próximos" ao excluir: apaga esta data e as próximas pendentes; a série termina antes desta data
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

revoke execute on function public.marcar_avulso(bigint), public.excluir_ocorrencia(bigint),
  public.editar_serie(bigint, text, date, time, text, bigint, text), public.encerrar_serie(bigint) from public, anon;
grant execute on function public.marcar_avulso(bigint), public.excluir_ocorrencia(bigint),
  public.editar_serie(bigint, text, date, time, text, bigint, text), public.encerrar_serie(bigint) to authenticated;
```

### Migração v8 — Acessos, ministérios, eventos semanais e reuniões (aplicada neste projeto em 19/11/2026)

Para um banco que já está na v7. Preserva os dados e as permissões de escala. Troca a regra de criação de eventos (só ADM), cria `recorrencias`, `reunioes` e `respostas_reuniao`.

```sql
-- 1) Ministérios (aproveita os existentes: Louvor vira "Música (Louvor)")
update public.areas set nome = 'Música (Louvor)' where nome = 'Louvor';
insert into public.areas (nome) values
  ('Diáconos'), ('Casais'), ('Juventude Básico'), ('Kids'), ('Alma (mulheres)'),
  ('Rosh (homens)'), ('Jiu-Jitsu'), ('Recepção')
on conflict (nome) do nothing;
-- cada ministério novo vê a própria escala (as permissões que já existiam não mudam)
insert into public.permissoes_visualizacao (area_id, pode_ver_area_id)
select id, id from public.areas on conflict do nothing;
-- conta de ADM do Davi com o nome dele
update public.lideres set nome = 'Davi' where id = '24d4491a-e46b-4238-b28a-91805855dd48' and nome = 'Administrador';

-- 2) Eventos oficiais: só o ADM cria (editar, apagar e concluir já eram só do ADM)
drop policy if exists eventos_inserir on public.eventos;
drop policy if exists eventos_admin_inserir on public.eventos;
create policy eventos_admin_inserir on public.eventos
  for insert to authenticated with check ((select public.eh_admin()));
do $$ declare c text; begin
  for c in select conname from pg_constraint
           where conrelid = 'public.eventos'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%tipo%' loop
    execute format('alter table public.eventos drop constraint %I', c);
  end loop;
end $$;
alter table public.eventos add constraint eventos_tipo_check check (tipo in ('culto', 'ensaio', 'reuniao', 'aula'));

-- 3) Repertório: o Louvor cadastra e ordena; Dança e Audiovisual consultam; o ADM gerencia
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
revoke execute on function public.pode_ver_repertorio(), public.pode_gerenciar_repertorio(bigint) from public, anon;
grant execute on function public.pode_ver_repertorio(), public.pode_gerenciar_repertorio(bigint) to authenticated;
drop policy if exists musicas_ler on public.musicas;
drop policy if exists musicas_inserir on public.musicas;
drop policy if exists musicas_alterar on public.musicas;
drop policy if exists musicas_apagar on public.musicas;
create policy musicas_ler on public.musicas
  for select to authenticated using ((select public.pode_ver_repertorio()));
create policy musicas_inserir on public.musicas
  for insert to authenticated with check (public.pode_gerenciar_repertorio(area_id));
create policy musicas_alterar on public.musicas
  for update to authenticated using (public.pode_gerenciar_repertorio(area_id)) with check (public.pode_gerenciar_repertorio(area_id));
create policy musicas_apagar on public.musicas
  for delete to authenticated using (public.pode_gerenciar_repertorio(area_id));

-- 4) Eventos semanais (recorrência controlada pelo ADM)
create table if not exists public.recorrencias (
  id          bigint generated always as identity primary key,
  titulo      text not null,
  tipo        text not null default 'culto' check (tipo in ('culto', 'ensaio', 'reuniao', 'aula')),
  dias        smallint[] not null default '{}' check (dias <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  horario     time,
  area_id     bigint references public.areas (id) on delete restrict,
  observacoes text,
  ativa       boolean not null default false,
  inicio      date not null default current_date,
  gerado_ate  date,
  criado_por  uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em   timestamptz not null default now()
);
create index if not exists recorrencias_area_id_idx on public.recorrencias (area_id);
alter table public.eventos add column if not exists recorrencia_id bigint references public.recorrencias (id) on delete set null;
create unique index if not exists eventos_recorrencia_data on public.eventos (recorrencia_id, data) where recorrencia_id is not null;

alter table public.recorrencias enable row level security;
drop policy if exists recorrencias_ler on public.recorrencias;
drop policy if exists recorrencias_admin on public.recorrencias;
create policy recorrencias_ler on public.recorrencias
  for select to authenticated using ((select public.eh_lider()));
create policy recorrencias_admin on public.recorrencias
  for all to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));

-- Cria as ocorrências (cada uma é um evento com data, escala e conclusão próprias)
create or replace function public.gerar_ocorrencias(p_ate date)
returns integer language plpgsql security definer set search_path = '' as $$
declare r record; v_ate date; v_ini date; n integer := 0; k integer;
begin
  if auth.uid() is not null and not public.eh_lider() then return 0; end if;
  v_ate := least(p_ate, current_date + 400);
  for r in select * from public.recorrencias
           where ativa and cardinality(dias) > 0 and coalesce(gerado_ate, inicio - 1) < v_ate
           for update skip locked loop
    v_ini := greatest(r.inicio, coalesce(r.gerado_ate + 1, r.inicio));
    insert into public.eventos (data, horario, titulo, tipo, area_id, observacoes, recorrencia_id, criado_por)
    select g::date, r.horario, r.titulo, r.tipo, r.area_id, r.observacoes, r.id, r.criado_por
    from generate_series(v_ini, v_ate, interval '1 day') g
    where extract(dow from g)::smallint = any (r.dias)
    on conflict (recorrencia_id, data) where recorrencia_id is not null do nothing;
    get diagnostics k = row_count;
    n := n + k;
    update public.recorrencias set gerado_ate = v_ate where id = r.id;
  end loop;
  return n;
end;
$$;

-- Depois que o ADM edita: atualiza as ocorrências futuras pendentes e tira as que não valem mais
create or replace function public.aplicar_recorrencia(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.recorrencias;
begin
  if not public.eh_admin() then raise exception 'permission denied'; end if;
  select * into r from public.recorrencias where id = p_id;
  if not found then return; end if;
  delete from public.eventos e
  where e.recorrencia_id = p_id and e.data >= current_date and e.concluido_em is null
    and (not r.ativa or not (extract(dow from e.data)::smallint = any (r.dias)) or e.data < r.inicio)
    and not exists (select 1 from public.escalas s where s.evento_id = e.id)
    and not exists (select 1 from public.musicas m where m.evento_id = e.id)
    and not exists (select 1 from public.materiais x where x.evento_id = e.id)
    and not exists (select 1 from public.itens_programa i where i.evento_id = e.id and i.lembrete is null);
  update public.eventos
     set titulo = r.titulo, horario = r.horario, tipo = r.tipo, area_id = r.area_id, observacoes = r.observacoes
   where recorrencia_id = p_id and data >= current_date and concluido_em is null;
  if r.ativa then
    update public.recorrencias set gerado_ate = current_date - 1 where id = p_id;
    perform public.gerar_ocorrencias(current_date + 56);
  end if;
end;
$$;
revoke execute on function public.gerar_ocorrencias(date), public.aplicar_recorrencia(bigint) from public, anon;
grant execute on function public.gerar_ocorrencias(date), public.aplicar_recorrencia(bigint) to authenticated;

-- 5) Reuniões: o ADM agenda; cada líder responde Vou ou Não vou (uma resposta por conta)
create table if not exists public.reunioes (
  id         bigint generated always as identity primary key,
  titulo     text not null,
  data       date not null,
  horario    time,
  local      text,
  pauta      text,
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em  timestamptz not null default now()
);
create index if not exists reunioes_data_idx on public.reunioes (data);
create table if not exists public.respostas_reuniao (
  reuniao_id    bigint not null references public.reunioes (id) on delete cascade,
  lider_id      uuid not null references public.lideres (id) on delete cascade,
  resposta      text not null check (resposta in ('vou', 'nao_vou')),
  respondido_em timestamptz not null default now(),
  primary key (reuniao_id, lider_id)
);
create index if not exists respostas_reuniao_lider_idx on public.respostas_reuniao (lider_id);

alter table public.reunioes enable row level security;
alter table public.respostas_reuniao enable row level security;
drop policy if exists reunioes_ler on public.reunioes;
drop policy if exists reunioes_admin on public.reunioes;
create policy reunioes_ler on public.reunioes
  for select to authenticated using ((select public.eh_lider()));
create policy reunioes_admin on public.reunioes
  for all to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));
drop policy if exists respostas_ler on public.respostas_reuniao;
drop policy if exists respostas_inserir on public.respostas_reuniao;
drop policy if exists respostas_alterar on public.respostas_reuniao;
drop policy if exists respostas_apagar on public.respostas_reuniao;
create policy respostas_ler on public.respostas_reuniao
  for select to authenticated using (lider_id = (select auth.uid()) or (select public.eh_admin()));
create policy respostas_inserir on public.respostas_reuniao
  for insert to authenticated with check (lider_id = (select auth.uid()) and (select public.eh_lider()));
create policy respostas_alterar on public.respostas_reuniao
  for update to authenticated using (lider_id = (select auth.uid())) with check (lider_id = (select auth.uid()));
create policy respostas_apagar on public.respostas_reuniao
  for delete to authenticated using (lider_id = (select auth.uid()) or (select public.eh_admin()));

-- 6) Privilégios e Realtime das tabelas novas
revoke all on public.recorrencias, public.reunioes, public.respostas_reuniao from anon;
grant select, insert, update, delete on public.recorrencias, public.reunioes, public.respostas_reuniao to authenticated;
grant usage, select on all sequences in schema public to authenticated;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'reunioes') then
    alter publication supabase_realtime add table public.reunioes, public.respostas_reuniao;
  end if;
end $$;

-- 7) Eventos semanais pedidos: Escola Talmidim (terça, 7h30, ativa) e Jiu-Jitsu (seg e qua, pendente)
--    (histórico: o horário oficial da Escola Talmidim passou a ser 19h30; o banco.sql atual já cria assim)
insert into public.recorrencias (titulo, tipo, dias, horario, area_id, ativa, criado_por)
select 'Escola Talmidim', 'aula', '{2}', '07:30', null, true, (select id from public.lideres where papel = 'admin' order by nome limit 1)
where not exists (select 1 from public.recorrencias where titulo = 'Escola Talmidim');
insert into public.recorrencias (titulo, tipo, dias, horario, area_id, ativa, criado_por)
select 'Jiu-Jitsu', 'aula', '{1,3}', null, (select id from public.areas where nome = 'Jiu-Jitsu'), false, (select id from public.lideres where papel = 'admin' order by nome limit 1)
where not exists (select 1 from public.recorrencias where titulo = 'Jiu-Jitsu');
select public.gerar_ocorrencias(current_date + 56);
```

### Migração v7 — Programa e conclusão de eventos (aplicada neste projeto em 19/11/2026)

Para um banco que já está na v6. Preserva os dados. A coluna `tom` das músicas continua no banco (o app só deixou de usá-la).

```sql
-- 1) Conclusão do evento
alter table public.eventos add column if not exists concluido_em timestamptz;
alter table public.eventos add column if not exists concluido_por uuid references auth.users (id) on delete set null;

-- 2) Programa: horário estimado e lembrete automático
alter table public.itens_programa add column if not exists horario time;
alter table public.itens_programa add column if not exists lembrete text;
create unique index if not exists itens_programa_lembrete_unico
  on public.itens_programa (evento_id, lembrete) where lembrete is not null;

-- 3) Último domingo do mês
create or replace function public.eh_ultimo_domingo(d date)
returns boolean language sql immutable set search_path = '' as $$
  select extract(dow from d) = 0 and extract(month from d + 7) <> extract(month from d);
$$;

-- 4) "Aniversariantes" no fim do programa dos cultos do último domingo (uma só vez)
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

drop trigger if exists trg_lembrete_aniversariantes on public.eventos;
create trigger trg_lembrete_aniversariantes
after insert or update of data, tipo on public.eventos
for each row execute function public.lembrete_aniversariantes();

revoke execute on function public.lembrete_aniversariantes() from public, anon, authenticated;

-- 5) Cultos que já estavam no calendário
insert into public.itens_programa (evento_id, area_id, ordem, titulo, tipo, lembrete)
select e.id, a.id, 9999, 'Aniversariantes', 'aviso', 'aniversariantes'
from public.eventos e
cross join (select id from public.areas where lower(nome) = 'audiovisual' limit 1) a
where e.tipo = 'culto' and public.eh_ultimo_domingo(e.data)
on conflict (evento_id, lembrete) where lembrete is not null do nothing;
```

### Migração v6 — Materiais (aplicada neste projeto em 19/11/2026)

Para um banco que já está na v5. Preserva os dados.

```sql
create table if not exists public.materiais (
id bigint generated always as identity primary key,
evento_id bigint not null references public.eventos (id) on delete cascade,
area_id bigint not null references public.areas (id) on delete restrict,
tipo text not null check (tipo in ('arquivo', 'link')),
nome text not null check (length(trim(nome)) > 0),
quando_usar text,
caminho text,
url text,
tamanho bigint,
enviado_por uuid default auth.uid() references auth.users (id) on delete set null,
criado_em timestamptz not null default now(),
constraint material_tem_destino check ((tipo = 'arquivo' and caminho is not null) or (tipo = 'link' and url ~* '^https?://')),
constraint material_caminho_coerente check (caminho is null or caminho like (evento_id::text || '/' || area_id::text || '/%'))
);
create index if not exists materiais_evento_id_idx on public.materiais (evento_id);
create index if not exists materiais_area_id_idx on public.materiais (area_id);
alter table public.materiais enable row level security;
drop policy if exists materiais_ler on public.materiais;
drop policy if exists materiais_inserir on public.materiais;
drop policy if exists materiais_apagar on public.materiais;
create policy materiais_ler on public.materiais for select to authenticated using (public.pode_ver_area(area_id));
create policy materiais_inserir on public.materiais for insert to authenticated with check (public.pode_editar_area(area_id) and enviado_por = (select auth.uid()));
create policy materiais_apagar on public.materiais for delete to authenticated using (public.pode_editar_area(area_id));
revoke all on public.materiais from anon;
grant select, insert, delete on public.materiais to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materiais', 'materiais', false, 52428800, array['audio/*', 'video/*'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.area_do_caminho(p_nome text)
returns bigint language sql immutable set search_path = '' as $$
select case when split_part(p_nome, '/', 2) ~ '^[0-9]+$' then split_part(p_nome, '/', 2)::bigint end;
$$;
revoke execute on function public.area_do_caminho(text) from public, anon;
grant execute on function public.area_do_caminho(text) to authenticated;

drop policy if exists materiais_storage_ler on storage.objects;
drop policy if exists materiais_storage_enviar on storage.objects;
drop policy if exists materiais_storage_apagar on storage.objects;
create policy materiais_storage_ler on storage.objects for select to authenticated using (bucket_id = 'materiais' and public.pode_ver_area(public.area_do_caminho(name)));
create policy materiais_storage_enviar on storage.objects for insert to authenticated with check (bucket_id = 'materiais' and public.pode_editar_area(public.area_do_caminho(name)));
create policy materiais_storage_apagar on storage.objects for delete to authenticated using (bucket_id = 'materiais' and public.pode_editar_area(public.area_do_caminho(name)));

do $$
begin
if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'materiais') then
alter publication supabase_realtime add table public.materiais;
end if;
end;
$$;
```

### Migração v5 (aplicada neste projeto em 19/11/2026)

Para um banco que já está na v4. Preserva os dados.

```sql
alter table public.eventos add column if not exists area_id bigint references public.areas (id) on delete restrict;
alter table public.eventos add column if not exists criado_por uuid default auth.uid() references auth.users (id) on delete set null;
create index if not exists eventos_area_id_idx on public.eventos (area_id);

drop policy if exists eventos_admin_inserir on public.eventos;
drop policy if exists eventos_inserir on public.eventos;
create policy eventos_inserir on public.eventos
for insert to authenticated
with check ((select public.eh_lider()) and (area_id is null or public.pode_editar_area(area_id)) and criado_por = (select auth.uid()));

-- Depois, copie do banco.sql as funções criar_lider, definir_senha_lider e remover_lider
-- (seção 3) e rode também:
revoke execute on function public.criar_lider(text, text, text, bigint, text), public.definir_senha_lider(uuid, text), public.remover_lider(uuid) from public, anon;
grant execute on function public.criar_lider(text, text, text, bigint, text), public.definir_senha_lider(uuid, text), public.remover_lider(uuid) to authenticated;
```

Se algum `add constraint` der erro de nome, veja o nome certo em **Database › Tables › (tabela) › Constraints** e troque no comando.

## 3. Colocar a URL e a chave anon

1. No Supabase, vá em **Project Settings** › **API** (ou **API Keys**).
2. Copie:
   - **Project URL** (ex.: `https://abcdefgh.supabase.co`)
   - A chave **anon public** (em projetos novos pode se chamar **publishable**, começando com `sb_publishable_`).
3. Abra `app.js` e troque as duas linhas do topo:

```js
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'cole-a-chave-anon-aqui';
```

**Importante:**

- A chave anon/publishable **pode** ficar no código e no GitHub: ela é pública por natureza, e quem protege os dados é a RLS do `banco.sql`.
- **Nunca** coloque a chave `service_role` / `secret` no código, no GitHub ou em qualquer lugar do site. Ela ignora todas as regras de segurança.

## 4. Configurar os endereços de login

No Supabase, vá em **Authentication** › **URL Configuration**:

- **Site URL:** o endereço do site no GitHub Pages, ex.: `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`
- **Redirect URLs:** adicione
  - `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/**`
  - `http://localhost:8124/**` e `http://127.0.0.1:8124/**` (para testar no computador; já cadastrados neste projeto)

Sem isso, o link de "Esqueci a senha" não volta para o app.

> **E-mails do Supabase:** o serviço de e-mail embutido do plano gratuito envia poucas mensagens por hora. Só é usado em "Esqueci a senha". Se travar, o admin pode definir uma senha nova em **Admin › Líderes › ✎**.

## 5. Login com Google

Ficou **fora do app**, a pedido. O login é só por e-mail e senha. O provedor Google continua desligado no Supabase.

## 6. Publicar no GitHub Pages

1. Crie um repositório no GitHub (pode ser público) e envie os arquivos: `index.html`, `app.js`, `estilo.css`, `manifest.json`, `sw.js`, `icone-180.png`, `icone-192.png`, `icone-512.png`, `banco.sql` e `README.md`.
   - Pelo site: **Add file** › **Upload files**, arraste os arquivos e clique em **Commit changes**.
2. No repositório, vá em **Settings** › **Pages**.
3. Em **Build and deployment**: Source **Deploy from a branch**, Branch **main**, pasta **/ (root)**. Salve.
4. Em 1 a 2 minutos o site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
5. Confira se esse endereço está nas **Redirect URLs** do passo 4.

**Testar no computador antes de publicar** (opcional), na pasta do projeto:

```powershell
python -m http.server 8124
```

Depois abra <http://localhost:8124>. Para testar duas contas ao mesmo tempo (ADM e líder), use uma aba em <http://localhost:8124> e outra em <http://127.0.0.1:8124>: cada endereço guarda o seu próprio login.

**Quando mudar o app:** troque a versão em `sw.js` (hoje é `igreja-v8.6`; na próxima mudança use `igreja-v9`) para os celulares pegarem os arquivos novos.

Para testar três contas ao mesmo tempo, use também <http://[::1]:8124>.

## 7. Criar o primeiro admin

(Já feito neste projeto. Serve para um projeto novo.)

1. No Supabase › **Authentication › Users › Add user › Create new user**, crie a sua conta com e-mail e senha e marque **Auto Confirm User**.
2. No **SQL Editor**, rode (com o **seu** e-mail e nome):

```sql
insert into public.convites_lideres (email, nome, area_id, papel)
values ('seu-email@exemplo.com', 'Seu Nome', null, 'admin');
```

3. Entre no app com esse e-mail e senha. A aba **Admin** aparece. Os próximos líderes você cadastra pelo app.

## 8. Cadastrar líderes e as contas de ADM

**Contas de ADM:** são cinco, uma por pessoa: Davi (já existe), mãe do Davi, pai do Davi, Elan e Fabrício. Para cada uma: **Administração › Líderes › + Novo líder**, com nome, e-mail, senha inicial e papel **Administrador** (sem ministério). Passe a senha em particular; a pessoa troca em **Alterar senha**.


1. **Admin › Líderes › + Novo líder**: nome, e-mail, **senha inicial** (mínimo 6 caracteres), papel (Líder ou Administrador) e ministério.
2. Passe a senha para a pessoa **em particular**. A conta já fica pronta, sem e-mail de confirmação.
3. A pessoa entra com e-mail e senha e pode trocar a senha em **Alterar senha**, no menu com o nome dela (canto superior direito).

- **Trocar a senha de alguém:** **Admin › Líderes › ✎ › Nova senha**.
- **Remover um líder:** **Admin › Líderes › ✎ › Remover líder**. A conta de login é apagada; as escalas que ele montou continuam. O admin não pode remover a si mesmo, e o banco não deixa remover nem rebaixar o último admin.

Como funciona por dentro: a função `criar_lider` do banco (só o admin pode chamar) cria a conta no Supabase Auth já confirmada, com a senha criptografada, e o registro em `lideres`. Nada usa a chave `service_role`.

## 9. Importar membros por CSV

1. Na planilha de aniversários, deixe a primeira linha com os títulos. Colunas aceitas (só **nome** é obrigatória):

| nome | nascimento | telefone | observacoes |
|---|---|---|---|
| Maria Silva | 23/11/1990 | (11) 99999-0000 | Soprano |
| João Souza | 05/03 | | |

2. No Excel ou Google Planilhas: **Arquivo › Salvar como / Fazer download › CSV**.
3. No app: **Membros › Cadastro › Importar CSV**, escolha o arquivo (ou cole o conteúdo).
4. Confira a prévia ("N membros prontos" e avisos de linhas com problema) e clique em **Importar**.

Detalhes:

- Separador vírgula ou ponto e vírgula. Acentos de arquivos do Excel são corrigidos automaticamente.
- Datas: `23/11/1990`, `23/11/90`, `23/11` (sem ano) ou `1990-11-23`.
- Sem ano, o app guarda o ano 1904 internamente e mostra só dia e mês.
- Colunas a mais (como "area") são ignoradas: o cadastro de membros é geral da igreja, sem área.
- Importar duas vezes o mesmo arquivo cria duplicados. Apague-os em **Membros › Cadastro**.

## 10. Testar ADM, líder do Louvor e líder do Audiovisual

Use três contas e três endereços: <http://127.0.0.1:8124> (ADM), <http://[::1]:8124> (Louvor) e <http://localhost:8124> (Audiovisual). Cada endereço guarda o próprio login.

1. **ADM:** no calendário, **+ Evento** e crie "Culto de domingo". **Líder do Louvor:** o calendário abre em **Semana**, sem **+ Evento**; no evento **não** aparece o lápis de editar nem a bolinha de concluir.
2. **Louvor:** **Adicionar escala** com três linhas (ex.: Vocal — Davi, Teclado — Ana Souza, Violão — Pedro). Uma linha só com a função mostra o aviso e não salva.
3. **Louvor:** **+ Música** três vezes (sem campo Tom) e use ↑ para mudar a ordem. Em **Programa**, **+ Item** com "Início do culto" às 19:00 e "Dança, após o Louvor" às 19:35: aparecem como "19:00 previsto — Início do culto".
4. **Líder do Audiovisual:** **Minha equipe** mostra só o próximo evento. **Adicionar escala** (Projeção — Davi, Iluminação — Ana), depois **Editar escala** (mude um nome, remova uma linha, adicione outra).
5. **Audiovisual:** abra o evento. **Músicas do evento** aparecem na ordem do Louvor, sem botões de mudar.
6. **ADM:** abra o evento, ✎, troque o horário, salve. Em **Ministérios › Louvor**, o próximo evento aparece em destaque com a escala.
7. **ADM:** **Importar eventos** (seção 15) com uma linha repetida e um evento diferente no mesmo dia.
8. **ADM:** **Membros › Aniversariantes**, escolha o mês e toque em **Copiar lista de aniversariantes**. Cole no WhatsApp para conferir.
9. **Louvor:** no evento, **+ Enviar material** › Arquivo de áudio ou vídeo (ex.: um .mp3), Nome "Playback da abertura", Quando usar "Após a abertura" › Enviar. Depois outro com **Link**.
10. **Audiovisual:** abra o mesmo evento. Os dois aparecem em **Materiais para o Audiovisual**, com "Louvor"; **Baixar** baixa o arquivo e **Abrir link** abre o link. Não aparece o ✕ de apagar nos itens do Louvor.
11. **Último domingo:** crie um culto no último domingo do mês. O programa ganha **Aniversariantes** no fim, uma vez só (veja como admin ou Audiovisual).
12. **ADM (PC):** no calendário, toque na bolinha vermelha do evento de teste › **Concluir**. Recarregue: ele está em **Concluídos neste mês** e o dia ficou com bolinha verde. Nos meses vizinhos ele não aparece.
13. **ADM (celular):** repita com outro evento.
14. **ADM:** **Reuniões › + Reunião**. **Louvor:** responde **Vou**, depois muda para **Não vou** e volta. **Audiovisual:** responde **Não vou**. **ADM:** a reunião mostra "1 confirmou · 1 recusou · 0 sem resposta" e os nomes em **Ver quem respondeu**.
15. **Semana:** confira o cabeçalho (ex.: "23 a 29 de novembro"), as setas e os eventos semanais (Escola Talmidim na terça às 19h30, Culto de domingo às 19h) com bolinha roxa. Na virada de mês: "30 de novembro a 6 de dezembro".
16. **ADM:** **+ Evento** › Tipo **Reunião**, com data, horário e local › Salvar. Abre a reunião; ela aparece no calendário (bolinha amarela) e na aba Reuniões, uma vez só. **Líder:** abre pelo calendário e responde.
17. **ADM:** **+ Evento** › culto num domingo às 19:00 › marque **Repetir toda semana**: aparece "Todo domingo às 19h". Salve e confira os domingos seguintes com bolinha roxa.
18. **ADM:** numa das datas, ✎ › mude o horário › **Só este evento**: só ela muda. Em outra, **Este e os próximos**: ela e as seguintes mudam, as anteriores não.
19. **Calendário:** abra **Eventos semanais** (começa recolhida), depois uma série: aparecem só as datas da semana ou do mês exibido. No Mês, toque num dia com bolinha roxa: as datas daquele dia aparecem logo abaixo.
20. **Louvor:** em **Minha equipe**, **Pular escala desta data** › confirme. Aparece em **Sem escala necessária** e o destaque passa para a próxima data. **Desfazer** volta. No evento, o mesmo botão fica na escala do Louvor. **Audiovisual:** no mesmo evento, vê "Sem escala necessária" no Louvor, sem Desfazer, e a escala dele continua pendente.
21. **ADM:** abra um evento: o **Resumo do evento** mostra todos os ministérios como Pendente. Depois que o Louvor pular a escala e o Audiovisual montar a escala, enviar um link e o Louvor adicionar uma música, o resumo mostra "Sem escala necessária", "Escala pronta · 1", o repertório e o material. **Desfazer** volta o Louvor para Pendente. Outra data da mesma série continua toda pendente.
22. **ADM:** conclua uma data pela bolinha e, em **Mês › Concluídos neste mês**, use **⋯ › Reabrir evento** › **Reabrir**. Recarregue: a data continua pendente, com escala, músicas e materiais.
23. **ADM:** apague os eventos e a reunião de teste (✎ › Excluir › **Este e os próximos** na primeira data apaga a série inteira). Os arquivos deles saem do Storage.

**Teste direto no banco** (F12 › Console), logado como **líder do Louvor**:

```js
// Editar ou apagar evento (mesmo criado por ele) → data: [] (nada muda)
await db.from('eventos').update({ titulo: 'x' }).eq('id', 1).select()
await db.from('eventos').delete().eq('id', 1).select()

// Criar evento de outro ministério (ex.: Teatro, id 4) → erro "row-level security"
await db.from('eventos').insert({ data: '2026-12-06', titulo: 'x', tipo: 'culto', area_id: 4 })

// Criar escala em outro ministério (Audiovisual, id 3) → erro "row-level security"
await db.from('escalas').insert({ evento_id: 1, area_id: 3, funcao: 'x', nome: 'x' })

// Cadastro de membros e criação de líder (só admin) → lista vazia / erro
await db.from('membros').select('*')
await db.rpc('criar_lider', { p_email: 'x@x.com', p_senha: '123456', p_nome: 'x', p_area_id: 1, p_papel: 'admin' })
```

Logado como **admin**:

```js
// Apagar ministério com evento ou escala → erro "foreign key"
await db.from('areas').delete().eq('id', 2).select()
```

## 11. Plano gratuito: projeto pausado

O Supabase **pausa projetos gratuitos depois de 1 semana sem atividade**. O app para de carregar dados (fica em "Carregando…" ou mostra erro de conexão). Os dados **não** são apagados na hora.

Para reativar:

1. Entre em <https://supabase.com/dashboard>.
2. Abra o projeto (aparece como **Paused**).
3. Clique em **Restore project** / **Resume project** e aguarde alguns minutos.
4. Abra o app de novo.

Dicas:

- Usar o app pelo menos uma vez por semana evita a pausa.
- Um projeto pausado por muito tempo pode não poder mais ser restaurado pelo painel (o prazo aparece na tela do projeto). Faça backup de vez em quando: **Table Editor** › cada tabela › **Export to CSV**.

## 12. Funções incluídas

- Calendário com **Semana** (segunda a domingo) e **Mês**; só o ADM cria, edita, apaga e conclui eventos.
- **Eventos semanais** (ADM) com bolinha roxa; cada data com escala e conclusão próprias.
- **Reuniões:** o ADM agenda (na aba Reuniões ou pelo + Evento com tipo Reunião); líderes respondem Vou/Não vou; o ADM vê confirmados, recusas e sem resposta.
- **Repetir toda semana** no + Evento, com prévia e escolha **Só este evento / Este e os próximos** ao editar ou excluir.
- **Eventos semanais agrupados** no calendário (uma linha por série, datas do período ao abrir).
- **Pular escala desta data** por ministério, com **Desfazer**.
- **Resumo do evento** (ADM): escala de cada ministério, repertório e materiais.
- **Reabrir evento** (ADM) em Concluídos neste mês.
- Evento: escala por ministério (linhas Função — Quem vai atuar), Músicas do evento na ordem do Louvor, programa com horário previsto, lembrete de Aniversariantes no último domingo, aniversariantes (em "Culto dos Aniversariantes", só admin).
- **Concluir evento** pela bolinha vermelha no calendário (admin) e seção **Concluídos neste mês**.
- **Materiais para o Audiovisual** no evento: arquivo de áudio/vídeo ou link, com "Quando usar?", Baixar ou Abrir link.
- **Minha equipe** (líder): próximo evento com Adicionar ou Editar escala, e anotações da equipe.
- **Ministérios** (admin): atalhos, próximo evento em destaque com a escala, anotações, renomear e apagar.
- **Membros** (admin): Cadastro (formulário e CSV), Lista e Aniversariantes, com Copiar lista.
- **Importar eventos** (admin): prévia com avisos de possível duplicado e de outros eventos no mesmo dia.
- **Admin:** líderes (criar com senha inicial, trocar senha, remover), painel de acessos, permissões de visualização.
- **Escala para o WhatsApp**, **Telão**, **Histórico** das últimas 8 semanas, **Realtime**, **PWA**, identidade escura Qhall, animações com Motion.

## 13. Visual (Qhall)

- **Marca:** cruz simples ao lado de **Qhall**, no canto superior esquerdo. O nome é branco; só a cor dentro da cruz muda devagar, num degradê de branco para azul-claro, sem brilho.
- **Abertura:** a marca aparece brevemente no centro e se encaixa no canto superior esquerdo enquanto o login aparece.
- **Cores:** fundo azul-marinho quase preto, cartões azul-ardósia e bordas finas. O app usa sempre essa identidade escura.
- **Fundo de luz fluida:** a mesma técnica da capa da Cantina Vicenza, nas cores do app. Uma camada contínua atrás de todas as telas, desenhada em WebGL (`<canvas>`): faixas largas de luz azul suave que se dobram e se movem devagar, como seda, sobre o azul-marinho, com um grão fino por cima e contraste baixo para o texto continuar legível. No **login** no ritmo normal; **dentro do app** (ex.: atrás do calendário) mais fraca (72%) e com cerca de um terço da velocidade; no telão ainda mais lenta. A troca entre login e app é suave. Desenha a ~30 quadros por segundo, em resolução baixa (leve no celular), e pausa quando a aba não está visível. Com "reduzir movimento", fica um quadro parado. Sem WebGL, aparece um degradê azul estático.
- **Fontes:** Bricolage Grotesque nos títulos e Inter nos textos e controles (carregadas do Google Fonts; sem internet, usa as fontes do sistema).
- **Navegação:** no PC, barra lateral fixa em azul-marinho sólido (#0D172B), com ícones e nomes, e o item ativo no azul mais vivo. No celular, as mesmas opções no menu inferior. Ordem: Calendário, Reuniões, Minha equipe (líder) ou Ministérios (admin), Membros e Administração (admin) e Histórico.
- **Topo:** faixa inteira em azul-marinho sólido (#0D172B), a mesma cor da barra lateral, da logo até o perfil, sem emenda, com uma linha fina e discreta embaixo. Cruz e Qhall à esquerda; à direita, o botão de perfil com borda suave, avatar azul com a inicial e o primeiro nome (ex.: "Davi ▾"); o menu tem **Alterar senha** e **Sair**. O degradê animado fica só atrás da área de conteúdo. A barra do navegador no celular usa a mesma cor.
- **Calendário:** dias Dom a Sáb com divisórias finas, fim de semana em azul discreto, data selecionada num quadrado azul de cantos arredondados e hoje com contorno. Mês centralizado entre as setas; **+ Evento** e, para o admin, **Importar eventos** logo abaixo, à direita. Bolinhas vermelha (pendente) e verde (concluído) com legenda.
- **Vidro discreto** (inspirado no Liquid Glass) nos botões, no menu do usuário e nas janelas de confirmação: leve transparência com desfoque, mantendo o texto legível. Navegadores sem desfoque usam fundo sólido.
- O degradê do fundo ficou um pouco mais visível.
- Transições curtas (200 a 400 ms). Com "reduzir movimento" ligado, o fundo fica parado, a cruz não muda de cor e a abertura não aparece.

## 14. Histórico de versões

**v8.6 (esta)**

- **Fundo igual ao da capa da Cantina Vicenza, em azul:** luz fluida em WebGL (ruído simplex com distorção, como seda), grão fino e degradê estático de reserva. Login no ritmo normal; dentro do app mais fraca e mais lenta; quadro parado com "reduzir movimento". Substitui as manchas da v8.5.
- `sw.js`: `igreja-v8.6`.

**v8.5**

- **Fundo fluido animado:** gradiente azul-marinho com manchas grandes de luz suave que se movem devagar, em camada contínua atrás das telas. Mais vivo no login; dentro do app, mais fraco e com cerca de um terço da velocidade. Versão parada com "reduzir movimento". Sem filtro de desfoque (mais leve no celular).
- `sw.js`: `igreja-v8.5`.

**v8.4**

- **Cabeçalho:** azul-marinho sólido (#0D172B) na faixa superior inteira e na barra lateral (e no menu inferior do celular), sem a emenda entre a área da logo e o resto do topo, com linha fina embaixo. Botão de perfil com borda mais suave; avatar e item ativo do menu continuam no azul vivo. Vale em todas as telas com cabeçalho, inclusive o login. Cor da barra do navegador (`theme-color`) igual. Tamanhos, espaçamentos, navegação e funções sem mudança.
- `sw.js`: `igreja-v8.4`.

**v8.3**

- **Resumo do evento** para o ADM na tela do evento: Escala pronta, Pendente ou Sem escala necessária por ministério; repertório do Louvor; materiais para o Audiovisual.
- **Pular escala desta data** aparece no resumo como "Sem escala necessária" (só para aquela equipe naquela data), com Desfazer.
- **Reabrir evento** (ADM) no menu ⋯ de cada item de **Concluídos neste mês**; a lista volta a incluir as datas semanais concluídas. Reabrir uma data semanal reabre só ela.
- Sem mudança no banco (a regra de que só o ADM altera eventos já valia).
- `sw.js`: `igreja-v8.3`.

**v8.2**

- **Calendário:** eventos semanais agrupados na seção recolhível **Eventos semanais**, uma linha por série; ao abrir, as datas do período exibido. No Mês, bolinhas na grade e todas as datas pelo dia selecionado.
- **Pular escala desta data** na escala do evento e em Minha equipe, com **Sem escala necessária** e **Desfazer**. Vale só para aquele ministério naquela data. Tabela `escalas_dispensadas` com RLS e Realtime.
- Cadastro inicial do `banco.sql` e README atualizados para as séries atuais (Culto de domingo 19h, Escola Talmidim 19h30, Jiu-Jitsu pendente).
- **Minha equipe** passa a considerar também os eventos semanais gerais (ex.: Culto de domingo); o destaque é a primeira data que a equipe não pulou.
- `sw.js`: `igreja-v8.2`.

**v8.1**

- **+ Evento:** tipo **Reunião** de volta; grava na tabela de reuniões (aparece no calendário e na aba Reuniões, sem duplicar).
- **Repetir toda semana** no + Evento, com prévia ("Todo domingo às 19h"), usando os eventos semanais da v8.
- Editar ou excluir uma data de evento semanal pergunta **Só este evento** ou **Este e os próximos**.
- Banco: `recorrencias.fim`, `recorrencias.pulos`, `eventos.avulso` e as funções `marcar_avulso`, `excluir_ocorrencia`, `editar_serie` e `encerrar_serie`.
- `sw.js`: `igreja-v8.1`.

**v8**

- **Acessos simplificados:** só o ADM cria, edita, exclui ou conclui eventos oficiais (app e Supabase). Líderes: calendário, escala do próprio ministério, itens da própria equipe, materiais e respostas às reuniões.
- **Ministérios:** Diáconos, Música (Louvor), Dança, Teatro, Casais, Juventude Básico, Kids, Alma (mulheres), Rosh (homens), Jiu-Jitsu, Mídia, Recepção e Audiovisual. Louvor virou "Música (Louvor)", sem duplicar. Sugestões de escala por ministério ("Todos os diáconos", salinha, Instagram, projeção/transmissão/iluminação).
- **Repertório:** Louvor cadastra e ordena; Dança e Audiovisual consultam; ADM gerencia (regra própria no Supabase).
- **Calendário:** visões Semana (segunda a domingo, intervalo real no cabeçalho, setas de semana) e Mês; líder abre em Semana. Bolinhas roxa (semanal) e amarela (reunião).
- **Eventos semanais** (Administração › Eventos semanais): Escola Talmidim (terça, 7h30; depois corrigida para o horário oficial, 19h30) ativa e Jiu-Jitsu (segunda e quarta) pendente. Cada data é um evento próprio.
- **Reuniões:** nova aba logo abaixo de Calendário, com Vou/Não vou e painel de respostas para o ADM.
- Conta de ADM do Davi renomeada de "Administrador" para "Davi".
- `sw.js`: `igreja-v8`.

**v7**

- **Programa:** horário estimado opcional por item, mostrado como "previsto". Itens ordenados pela ordem e depois pelo horário.
- **Aniversariantes** automático no fim do programa dos cultos do último domingo do mês (gatilho no banco, uma vez só), como lembrete para o Audiovisual.
- **Concluir evento:** bolinha vermelha em cada evento pendente; para o admin abre a confirmação no próprio calendário. Seção **Concluídos neste mês** recolhida, com bolinha verde e nome riscado. Grade com bolinha vermelha/verde por dia. Evento concluído mostra o selo "Concluído" e sai do destaque de Minha equipe/Ministérios.
- **Músicas:** campo Tom removido do formulário, do evento, do Telão, do Histórico e do texto do WhatsApp. Link e ordem do Louvor continuam.
- **Visual:** divisórias finas na grade, data selecionada em quadrado arredondado, vidro discreto em botões, menu e janelas, fundo um pouco mais visível.
- Banco: colunas `eventos.concluido_em`/`concluido_por`, `itens_programa.horario`/`lembrete`, função `eh_ultimo_domingo` e gatilho `trg_lembrete_aniversariantes`.
- `sw.js`: `igreja-v7`.

**v6**

- **Novo visual Qhall:** marca com a cruz animada, abertura no centro, fundo azul-marinho com degradê em movimento, cartões azul-ardósia, Bricolage Grotesque + Inter, barra lateral fixa no PC e menu inferior no celular, avatar com menu (Alterar senha, Sair). Ícones do app refeitos (cruz clara sobre azul-marinho) e nome do app "Qhall".
- **Materiais para o Audiovisual** no evento: arquivos de áudio/vídeo (pasta privada no Storage) e links, com "Quando usar?". Tabela `materiais`, bucket privado `materiais` e regras de acesso iguais às do app.
- **Minha equipe e Ministérios:** só o próximo evento em destaque (Adicionar ou Editar escala) e as anotações logo abaixo.
- Apagar um evento também apaga os arquivos de materiais dele no Storage. Ministério com material ligado não pode ser apagado.
- `sw.js`: `igreja-v6`.

**v5**

- **Login só com e-mail e senha.** Saíram "Entrar com Google" e "Primeiro acesso". O admin cadastra o líder com **senha inicial** (função `criar_lider` no banco), pode trocar a senha (`definir_senha_lider`) e remover o líder (`remover_lider`). Botão **Senha** para cada um trocar a própria.
- **Calendário:** qualquer líder cria evento (geral ou do próprio ministério); só o admin edita ou apaga. Tocar num dia mostra os eventos daquela data logo abaixo. Eventos ganharam `area_id` (ministério responsável) e `criado_por`.
- **Escala em linhas:** novo editor com várias linhas Função — Quem vai atuar, adicionar e remover linhas; grava só o que mudou.
- **Minha equipe:** só o próximo evento, com Adicionar ou Editar escala.
- **Ministérios:** a seção Equipes do admin virou **Ministérios**, com atalhos e o próximo evento em destaque.
- **Músicas do evento:** o Louvor (e o admin) cadastra e ordena com ↑ ↓; os outros ministérios veem na ordem.
- **Aniversariantes:** corrigido o erro `membros.area_id` (a consulta ainda pedia uma coluna que tinha saído). Botão **Copiar lista de aniversariantes** e lista do mês no "Culto dos Aniversariantes".
- **Importar eventos** (admin), com prévia e avisos.
- **Exclusão de ministério** agora também conta eventos ligados.
- **Banco:** migração v5 aplicada no Supabase; o evento de teste de 22/11 e as 4 escalas foram removidos. `sw.js`: `igreja-v5`.

**v4**

- **Calendário:** o domingo mostra **Escalas** primeiro, com a equipe do líder no topo e o botão **Adicionar escala**. O nome é digitado; "Salvar e adicionar outro" serve para várias pessoas.
- **Equipes:** nova seção no menu do admin, com uma página por equipe (escalas dos próximos 60 dias, músicas, programa, anotações, renomear e apagar). O líder ganhou o atalho **Minha equipe**. A antiga aba Anotações foi para dentro da página da equipe.
- **Membros:** seção só do admin com três abas (Cadastro, Lista, Aniversariantes), separada das equipes.
- **Escala sem ligação com Membros:** a ligação opcional escala↔cadastro foi removida (coluna `membro_id`, gatilho e função `membros_basico`). Com isso **acabou a contagem de escalas por pessoa** na lista de membros.
- **Apagar equipe:** mostra o motivo do bloqueio (quantas escalas, músicas, itens, anotações, líderes ou convites) e as permissões saem junto quando a equipe está vazia.
- **Menu lateral** em telas largas (computador, tablet deitado); no celular continua embaixo.
- **Supabase configurado:** projeto `igreja` no plano Free (São Paulo), `banco.sql` aplicado, chave pública no `app.js`, endereços de teste local liberados. Testado no banco real com uma conta de ADM e uma de líder.
- `sw.js`: versão `igreja-v4`.

**v3**

Funções (decididas nesta versão):

- **Escalas:** o líder digita o nome de quem vai servir, sem lista. O admin vê e edita todas e pode ligar uma escala a um membro do cadastro (só essas contam por pessoa). No banco, só o admin consegue preencher essa ligação. Acabou o "Nome oculto".
- **Membros:** cadastro geral da igreja, sem área, numa seção própria (**Membros**, só admin) com Cadastro e Aniversariantes. A importação CSV ignora a coluna de área.
- **Acessos:** painel só do admin (**Admin › Acessos**) com a última vez que cada líder abriu o app. O app registra a abertura (no máximo a cada 10 minutos), não só o login, que fica salvo por semanas.
- **Áreas:** o admin pode apagar uma área vazia pelo app; as permissões dela saem junto. Com qualquer outro registro ligado, o banco recusa.
- Janelas: o fechamento não depende mais só do evento `close` do navegador (num navegador embutido ele não disparava e a confirmação de exclusão travava).

Visual e interno:

- Login e telão com fundo de feixes de luz, título grande em branco e subtítulo cinza claro. O login fica escuro em qualquer modo do celular.
- Menu inferior novo: barra flutuante, botões circulares com ícones SVG de linha (sem emoji) e balão com o nome do item ativo, nos modos claro e escuro. O item ativo agora é anunciado para leitores de tela (`aria-current`).
- Emojis dos botões do evento (Telão, WhatsApp) e da lista de membros trocados por ícones de linha ou texto.
- `manifest.json`: só os ícones PNG (192 e 512) para Android; saiu o ícone SVG embutido, que alguns Androids escolhiam no lugar do PNG. A cor de fundo da abertura do app agora é escura, igual ao login.
- `sw.js`: versão `igreja-v3`, para os celulares baixarem os arquivos novos.
- README: estado atual das escalas, regras de exclusão, trecho SQL para quem já tinha rodado a versão 1, testes novos no console e checklist atualizado.
- Versões das bibliotecas conferidas no npm e no jsDelivr: `@supabase/supabase-js@2.118.0` e `motion@14.7.1` existem e carregam.

**v2**

- Área com conteúdo não pode ser apagada (`on delete restrict`).
- Só o admin vê membros e nomes; líderes veem "Nome oculto" na escala.
- Admin vê o último acesso de cada líder e as anotações de todas as áreas.
- Ícones PNG para iPhone (`apple-touch-icon`) e Android.

---

## 15. Importar eventos (calendário do ano)

**Calendário › Importar eventos** (só admin). Cole a lista ou escolha um CSV, uma linha por evento:

| data | horario | titulo | ministerio | tipo | observacoes |
|---|---|---|---|---|---|
| 12/01/2027 | 19:30 | Culto de Louvor | Louvor | | |
| 12/01/2027 | 19:30 | Culto de Dança | Dança | | |
| 05/02 | 20h | Ensaio geral | | ensaio | |

- Só **data** e **titulo** são obrigatórios. Sem ano, usa o "Ano das datas sem ano" (já vem 2027 a partir de outubro).
- Horário: `19:30`, `19h30`, `19h`. Tipo: culto, ensaio ou reunião (se vazio, o app deduz pelo título).
- **Prévia:** mostra título, data e horário de cada linha antes de salvar.
- **Possível duplicado** (mesma data e mesmo título de um evento já cadastrado ou repetido na lista): vem **desmarcado** e mostra o nome e o horário do existente. Marque se quiser importar mesmo assim.
- **Outro evento no mesmo dia** (título diferente): vem **marcado**, com o aviso "Neste dia também tem: Culto de Louvor 19:30". Os dois ficam no calendário.

## Checklist de testes

**Login e contas**

- [ ] Login só mostra e-mail, senha e "Esqueci a senha".
- [ ] Admin cadastra líder com senha inicial; o líder entra com ela; **Alterar senha** (menu do nome) troca a senha.
- [ ] Admin troca a senha de um líder e remove um líder (a pessoa não entra mais).
- [ ] E-mail com conta mas sem cadastro de líder vê "Acesso não liberado" e nenhum dado.

**Calendário e eventos**

- [ ] Tocar num dia mostra abaixo os eventos da data, com nome e horário.
- [ ] Líder não vê **+ Evento**, o lápis de editar nem a bolinha de concluir; pelo console, criar, editar, apagar ou concluir evento é recusado pelo Supabase.
- [ ] Líder abre o calendário em **Semana**; ADM em **Mês**; o botão troca entre as duas.
- [ ] Semana de segunda a domingo, cabeçalho com o intervalo real (inclusive na virada de mês e de ano) e setas de uma semana.
- [ ] Em cada dia da semana, eventos e reuniões em ordem de horário.
- [ ] Admin edita e apaga qualquer evento, inclusive os criados por líderes.
- [ ] Bolinha vermelha em cada evento pendente; para o admin, tocar nela abre "Marcar este evento como concluído?" no próprio calendário (PC e celular).
- [ ] Depois de recarregar, o evento continua em **Concluídos neste mês** (recolhido até tocar no título), com bolinha verde e nome riscado.
- [ ] Grade: dia com pendente = bolinha vermelha; todos concluídos = verde. O concluído aparece só no mês dele.
- [ ] Líder vê as bolinhas, mas não conclui.

**Eventos semanais e reuniões**

- [ ] Escola Talmidim aparece toda terça às 19h30 e o Culto de domingo todo domingo às 19h, com bolinha roxa; Jiu-Jitsu não aparece (pendente).
- [ ] Concluir uma data de um evento semanal não conclui as outras; cada data tem a própria escala.
- [ ] Editar os dias de um evento semanal tira as próximas datas sem escala e mantém as que já têm escala.
- [ ] Reunião aparece no calendário com bolinha amarela e na aba Reuniões.
- [ ] **+ Evento** com tipo Reunião: mostra Local e Pauta; salva uma reunião só (nada em eventos) e ela aparece no calendário e na aba Reuniões.
- [ ] **Repetir toda semana** mostra a prévia (ex.: "Todo domingo às 19h") e cria as próximas datas com bolinha roxa.
- [ ] Cada data tem escala, repertório, materiais e conclusão próprios.
- [ ] Editar **Só este evento** muda só a data escolhida; **Este e os próximos** muda ela e as seguintes.
- [ ] Excluir **Só este evento** tira só a data (não volta); **Este e os próximos** tira ela e as seguintes pendentes.
- [ ] Seção **Eventos semanais** começa recolhida, tem uma linha por série e, ao abrir a série, mostra só as datas do período exibido.
- [ ] No Mês, tocar num dia com bolinha roxa mostra as datas semanais daquele dia.
- [ ] **Pular escala desta data** pergunta "Marcar esta data como sem escala para sua equipe?", mostra **Sem escala necessária** e tira a data do destaque de Minha equipe; **Desfazer** volta.
- [ ] Outro ministério não é afetado e não consegue marcar nem desfazer pela equipe dos outros.
- [ ] **Resumo do evento** só aparece para o ADM e mostra a situação de cada ministério, o repertório e os materiais; pular ou desfazer muda só a equipe daquela data.
- [ ] **Reabrir evento** (⋯ em Concluídos neste mês, só ADM) pergunta "Voltar este evento para os pendentes?"; depois de recarregar, continua pendente e mantém escalas, músicas, programa e materiais. Líder não conclui nem reabre (Supabase recusa).
- [ ] Líder responde Vou/Não vou e muda a resposta; fica uma resposta só por conta.
- [ ] ADM vê confirmaram, recusaram e sem resposta, com os nomes.
- [ ] Líder não consegue responder por outro nem agendar reunião (Supabase recusa).

**Programa**

- [ ] Item com nome e horário estimado opcional; o horário aparece com "previsto".
- [ ] Culto no último domingo do mês recebe **Aniversariantes** no fim do programa, uma vez só; mudar a data para outro domingo tira o lembrete.

**Escalas e músicas**

- [ ] Minha equipe mostra só o próximo evento com Adicionar ou Editar escala.
- [ ] Editor de escala: várias linhas, adicionar e remover; linha incompleta mostra aviso.
- [ ] Líder edita só o próprio ministério; admin edita todos (no evento e em Ministérios).
- [ ] Louvor cadastra (sem campo Tom) e reordena músicas; Dança, Audiovisual e ADM veem **Músicas do evento** na mesma ordem; Audiovisual não consegue cadastrar nem alterar; outros ministérios não veem.
- [ ] Diáconos: sugestão "Todos os diáconos"; Kids, Mídia e Audiovisual mostram a dica da função.
- [ ] Nomes de outros ministérios aparecem só conforme as permissões.

**Materiais para o Audiovisual**

- [ ] Cartão logo abaixo de Escala; formulário recolhido até tocar em **+ Enviar material** (admin e líderes de todos os ministérios).
- [ ] Envio de arquivo de áudio/vídeo e de link, com "Quando usar?".
- [ ] Cada item mostra nome, ministério e Baixar ou Abrir link; o Audiovisual vê e baixa tudo.
- [ ] Arquivo acima de 50 MB ou que não é áudio/vídeo mostra aviso e não sobe.
- [ ] Ministério sem permissão de ver o Louvor não vê os materiais do Louvor; sem login, o arquivo não abre.

**Visual**

- [ ] Abertura: a marca aparece no centro e vai para o canto superior esquerdo.
- [ ] Cruz muda devagar de branco para azul-claro; nome Qhall branco.
- [ ] PC: barra lateral sólida com item ativo em azul. Celular: mesmas opções no menu inferior.
- [ ] Cabeçalho inteiro em azul-marinho sólido (#0D172B), igual à barra lateral, sem emenda perto da logo e com linha fina embaixo; perfil com borda suave e avatar azul (PC e celular).
- [ ] Avatar com inicial e nome; menu com Alterar senha e Sair.
- [ ] Calendário com Dom a Sáb, divisórias finas e data selecionada em quadrado arredondado.
- [ ] Botões, menu do usuário e janelas de confirmação com vidro discreto e texto legível.
- [ ] Com "reduzir movimento" ligado, nada se move (o fundo fica parado com as mesmas manchas).
- [ ] Fundo de luz fluida (faixas de luz azul como seda): no login se move de forma visível; dentro do app (calendário) fica mais fraco e bem mais lento, e o texto continua legível. Sem WebGL, aparece o degradê estático.

**Ministérios e Membros**

- [ ] Ministérios (só admin): atalhos, próximo evento em destaque com a escala.
- [ ] Apagar ministério com evento, escala, música etc. mostra o motivo; vazio apaga e as permissões saem junto.
- [ ] Membros → Aniversariantes abre sem erro; **Copiar lista de aniversariantes** copia todos os nomes do mês escolhido.
- [ ] "Culto dos Aniversariantes" mostra a lista do mês da data do evento (só admin).

**Importar eventos**

- [ ] Prévia com título, data e horário.
- [ ] Possível duplicado (mesmo dia e mesmo título) vem desmarcado, com nome e horário do existente.
- [ ] Outro evento no mesmo dia (título diferente) vem marcado, com aviso; importar mantém os dois.

**Geral**

- [ ] `sw.js` em `igreja-v8.6`; celular mostra a versão nova depois de fechar e abrir.
- [ ] Telão, WhatsApp, Histórico e Materiais funcionam no celular.
- [ ] Nenhum arquivo contém a chave `service_role` / `secret`.

## O que foi assumido

1. **Logins por convite.** Criar usuário pelo admin exigiria a chave `service_role` no site. Em vez disso, o admin cadastra o e-mail e a própria pessoa cria o acesso (Google ou senha). Para isso existe a tabela extra `convites_lideres`.
2. **Só o admin cria eventos** (regra da v8, pedida). Todos os líderes veem o calendário inteiro.
3. **Mídia vê só Mídia** (não estava definido).
4. **A própria área é sempre visível**, mesmo que a permissão seja desmarcada.
5. **Área nova não fica visível automaticamente para o Audiovisual**; o admin marca na tela de permissões.
6. **Escala guarda só o nome digitado**, sem ligação com o cadastro de membros. Não existe mais contagem de escalas por pessoa.
7. **Só o admin vê o cadastro de membros.** Os nomes nas escalas são os que os líderes digitaram e aparecem para quem pode ver aquela área.
8. **Nascimento sem ano** é guardado como 1904 e exibido só como dia/mês.
9. **Ícones** são PNGs gerados (cruz clara com degradê sobre azul-marinho): `icone-180.png` para o iPhone e `icone-192.png` e `icone-512.png` para Android. Para trocar, substitua os arquivos mantendo os nomes.
10. **Bibliotecas fixadas** em supabase-js 2.118.0 e Motion 14.7.1, carregadas do jsDelivr (versões conferidas no npm).
11. **Rotas com `#`** (ex.: `#/evento/12`) para funcionar no GitHub Pages sem configuração.
12. **Último acesso** é a abertura do app (registrada no máximo a cada 10 minutos) ou o último login, o que for mais recente.
13. **"Menu lateral do ADM"** foi entendido como a seção **Equipes** no menu do admin; no computador o menu inteiro fica na lateral, no celular continua embaixo.
14. **Página da equipe** mostra os próximos 60 dias (até 12 eventos). Eventos mais antigos continuam no calendário.
15. **Menu no modo escuro:** a referência é uma barra clara; no modo escuro ela fica cinza-escura para não ofuscar. Para deixar a barra clara também no escuro, troque as cores `--barra` no `estilo.css`.

16. **Vídeo do Lovable:** não tive acesso ao vídeo. A organização seguiu a descrição do pedido.
17. **Cadastro aberto (sign up)** continua ligado no Supabase, mas o app não oferece cadastro. Quem criar conta por fora não vê nada (RLS). Para fechar de vez: **Authentication › Sign In / Providers › Allow new users to sign up** desligado (o cadastro pelo admin continua funcionando).
18. **Músicas:** o botão de cadastrar e ordenar aparece para o admin e para o líder do ministério cujo nome tem "Louvor".
19. **"Culto dos Aniversariantes"** é reconhecido por ter "aniversariante" no título.

20. **Identidade escura sempre:** o visual Qhall é escuro; o modo claro automático da v5 deixou de existir.
21. **Imagem de referência:** a imagem anexada mostrava a marca (cruz + Qhall). A barra lateral, as cores e o calendário seguiram a descrição do pedido.
22. **Histórico** continua no menu, depois dos itens pedidos, para não perder a função.
23. **Materiais:** o limite de 50 MB por arquivo e 1 GB no total é do plano gratuito do Supabase. Vídeos maiores devem ir como link.
24. **Abertura** aparece a cada vez que o app é aberto (dura menos de 1,5 s).
25. **Lembrete de Aniversariantes** pertence ao ministério **Audiovisual** (procurado pelo nome). Se não existir um ministério com esse nome, o lembrete não é criado.
26. **Próximos eventos** lista todos os eventos pendentes do mês, inclusive datas que já passaram e ainda não foram concluídas, para o admin lembrar de concluir.
27. **Reabrir evento concluído:** desde a v8.3, pelo menu ⋯ em **Concluídos neste mês** (só ADM).
28. **Tom das músicas:** a coluna continua no banco para não perder dados antigos, mas não aparece mais em lugar nenhum.
29. **ADM abre em Mês, líderes em Semana:** o pedido falava da visão Semana para os líderes; o ADM continua no Mês, onde conclui eventos e vê os concluídos. Os dois trocam pelo botão.
30. **Reuniões ficam fora de "eventos":** têm tabela própria (`reunioes`). No **+ Evento**, o tipo Reunião grava nessa tabela (v8.1). Ao editar um evento já existente, não dá para transformá-lo em reunião. Também existe o tipo **Aula** (Escola Talmidim, Jiu-Jitsu).
35. **Reunião não se repete:** "Repetir toda semana" vale para cultos, ensaios e aulas; com o tipo Reunião a opção some.
36. **"Este e os próximos" divide a série:** a antiga passa a ter fim e aparece em Administração › Eventos semanais com "até dd/mm/aaaa"; a nova começa na data editada.
37. **Mudança da série depois de "Só este evento":** a data alterada só nela não é sobrescrita quando o ADM muda a série inteira em Eventos semanais.
38. **Sem escala só para datas sem escala montada:** o botão **Pular escala desta data** aparece quando a equipe ainda não tem ninguém escalado naquela data. Para pular uma data que já tem escala, apague as linhas antes.
39. **Concluídos neste mês** mostra todos os eventos concluídos do mês, inclusive as datas semanais (com bolinha roxa), para que o ADM possa reabrir qualquer uma. A situação de cada data semanal também aparece dentro da série, em **Eventos semanais**.
40. **Resumo do evento** lista todos os ministérios cadastrados, porque qualquer um pode montar escala num evento. Os que não servem naquela data usam **Pular escala desta data**.
31. **Quem responde às reuniões:** as contas de líder. As contas de ADM agendam e acompanham.
32. **Repertório por nome do ministério:** Louvor gerencia; Dança e Audiovisual consultam. Se um desses ministérios for renomeado sem "Louvor", "Dança" ou "Audiovisual" no nome, a regra precisa de ajuste no banco.
33. **Minha equipe (v8.2):** o filtro da v8 que ignorava eventos semanais gerais saiu, porque escondia o Culto de domingo (que virou série). Agora todos os eventos entram e a equipe usa **Pular escala desta data** nas datas em que não serve (ex.: Escola Talmidim).
34. **Na semana, os concluídos aparecem no próprio dia** (bolinha verde e nome riscado); a seção **Concluídos neste mês** continua na visão Mês.

## Decisões tomadas sobre as escalas e áreas

| Opção | Resultado |
|---|---|
| 1. Só o admin monta as escalas | Não. O foco é o líder; o admin vê e edita. |
| 2. O líder digita o nome, sem ver a lista | **Sim.** Sem ligação com o cadastro de Membros, então não há contagem por pessoa. |
| 3. Lista de membros liberada por área | Não. Membros ficam sem ligação com as áreas. |
| 4. Líder vê o nome de quem está escalado | **Sim**, porque ele mesmo digita os nomes. |
| 5. Admin apaga área pelo app, só se vazia | **Sim.** Permissões saem junto; qualquer outro registro bloqueia. |
