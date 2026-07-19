import logo from "../assets/logo.png";

const TERMS_STYLES = `
.terms-doc{
  --td-paper:#f6f3eb;--td-paper-2:#ede8d9;--td-card:#fffdf7;--td-card-edge:#e8e2d0;
  --td-ink:#1a1640;--td-ink-2:#3b375f;--td-ink-3:#6b6788;--td-ink-4:#9b97b3;
  --td-green:#0f7a4f;--td-green-deep:#0a5a3a;--td-mint-wash:rgba(78,232,163,.24);
  --td-red:#b3382c;--td-red-wash:#f5dad5;
  --td-sans:"Geist",-apple-system,BlinkMacSystemFont,sans-serif;
  --td-serif:"Newsreader",Georgia,serif;
  --td-mono:"Geist Mono",ui-monospace,Menlo,monospace;
  min-height:100vh;background:var(--td-paper);color:var(--td-ink);
  font-family:var(--td-sans);line-height:1.65;font-size:16px;
  -webkit-font-smoothing:antialiased;scroll-behavior:smooth;
}
.terms-doc a{color:inherit}
.terms-doc .shell{max-width:820px;margin:0 auto;padding:0 24px 96px;position:relative;z-index:1}
.terms-doc header.masthead{padding:64px 0 36px;border-bottom:1px solid var(--td-card-edge);margin-bottom:36px}
.terms-doc .eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:var(--td-sans);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--td-ink-3);margin:0 0 16px;font-weight:500}
.terms-doc .eyebrow::before{content:"";width:24px;height:1px;background:var(--td-ink-4);display:inline-block}
.terms-doc .logo{display:inline-flex;align-items:baseline;gap:5px;font-family:var(--td-serif);font-size:22px;font-weight:500;letter-spacing:-.01em;color:var(--td-ink);margin-bottom:22px}
.terms-doc .logo .dot{color:var(--td-green);font-style:italic}
.terms-doc h1{font-family:var(--td-serif);font-size:42px;line-height:1.1;margin:0 0 16px;color:var(--td-ink);font-weight:500;letter-spacing:-.02em}
.terms-doc .dek{font-size:15.5px;color:var(--td-ink-3);max-width:60ch;margin:0}
.terms-doc .meta-row{display:flex;gap:24px;flex-wrap:wrap;margin-top:26px;font-size:13px;color:var(--td-ink-3)}
.terms-doc .meta-row span strong{color:var(--td-ink);font-weight:600}
.terms-doc nav.toc{background:var(--td-card);border:1px solid var(--td-card-edge);border-radius:14px;padding:24px 28px;margin-bottom:56px;box-shadow:0 1px 0 rgba(26,22,64,.04),0 1px 2px rgba(26,22,64,.04)}
.terms-doc nav.toc h2{font-family:var(--td-sans);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--td-ink-3);margin:0 0 14px;font-weight:600}
.terms-doc nav.toc ol{margin:0;padding-left:0;list-style:none;columns:2;column-gap:32px}
.terms-doc nav.toc li{font-size:14px;margin-bottom:9px;break-inside:avoid}
.terms-doc nav.toc a{color:var(--td-ink-2);text-decoration:none;border-bottom:1px solid transparent;transition:border-color .15s ease,color .15s ease}
.terms-doc nav.toc a:hover,.terms-doc nav.toc a:focus-visible{border-bottom-color:var(--td-green);color:var(--td-ink)}
.terms-doc .part-label{font-family:var(--td-sans);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--td-green);font-weight:600;margin:64px 0 8px;display:flex;align-items:center;gap:10px}
.terms-doc .part-label::after{content:"";flex:1;height:1px;background:var(--td-card-edge)}
.terms-doc h2{font-family:var(--td-serif);font-size:27px;font-weight:500;color:var(--td-ink);margin:0 0 20px;padding-bottom:14px;border-bottom:1px solid var(--td-card-edge);letter-spacing:-.01em}
.terms-doc h3{font-family:var(--td-serif);font-size:18px;font-weight:600;color:var(--td-ink);margin:28px 0 10px}
.terms-doc p{margin:0 0 16px;color:var(--td-ink-2)}
.terms-doc ul,.terms-doc ol.clauses{margin:0 0 16px;padding-left:22px;color:var(--td-ink-2)}
.terms-doc li{margin-bottom:8px}
.terms-doc strong{color:var(--td-ink);font-weight:600}
.terms-doc .callout{background:linear-gradient(180deg,var(--td-mint-wash),transparent);border-left:3px solid var(--td-green);padding:16px 20px;border-radius:0 10px 10px 0;margin:20px 0;font-size:15px}
.terms-doc .callout p:last-child{margin-bottom:0}
.terms-doc .callout.warn{border-left-color:var(--td-red);background:linear-gradient(180deg,var(--td-red-wash),transparent)}
.terms-doc table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px}
.terms-doc th,.terms-doc td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--td-card-edge);vertical-align:top}
.terms-doc th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--td-ink-3);font-weight:600}
.terms-doc td{color:var(--td-ink-2)}
.terms-doc code{background:var(--td-paper-2);padding:2px 6px;border-radius:4px;font-size:.9em;font-family:var(--td-mono);color:var(--td-ink)}
.terms-doc .anchor-offset{scroll-margin-top:24px}
.terms-doc footer.doc-footer{margin-top:72px;padding-top:24px;border-top:1px solid var(--td-card-edge);font-size:13px;color:var(--td-ink-4)}
.terms-doc .back-to-top{display:inline-block;margin-top:40px;font-size:13px;color:var(--td-green);text-decoration:none;border-bottom:1px solid var(--td-card-edge)}
.terms-doc .back-to-top:hover{border-bottom-color:var(--td-green)}
.terms-doc .top-nav{position:sticky;top:0;z-index:10;background:rgba(246,243,235,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--td-card-edge);padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
@media (max-width:640px){.terms-doc{font-size:15.5px}.terms-doc h1{font-size:32px}.terms-doc header.masthead{padding-top:44px}.terms-doc nav.toc ol{columns:1}}
@media print{.terms-doc nav.toc{display:none}.terms-doc .back-to-top{display:none}}
`;

const TERMS_CONTENT = `
<div class="shell">

<header class="masthead">
<div class="logo"><span>Escritor</span><span class="dot">.ai</span></div>
<p class="eyebrow">Documento legal</p>
<h1>Termos de Uso e Política de Privacidade</h1>
<p class="dek">Este documento explica, em linguagem direta, como a plataforma funciona, o que esperamos de quem a usa, e como tratamos os dados e o conteúdo que você produz aqui.</p>
<div class="meta-row">
<span><strong>Versão:</strong> 1.0</span>
<span><strong>Última atualização:</strong> 18 de julho de 2026</span>
<span><strong>Contato:</strong> privacidade@escritor.ai</span>
</div>
</header>

<nav class="toc" aria-label="Sumário">
<h2>Neste documento</h2>
<ol>
<li><a href="#definicoes">1. Definições</a></li>
<li><a href="#objeto">2. O que é o Escritor.ai</a></li>
<li><a href="#conta">3. Conta e elegibilidade</a></li>
<li><a href="#propriedade">4. Propriedade da sua obra</a></li>
<li><a href="#uso-aceitavel">5. Uso aceitável</a></li>
<li><a href="#natureza-ia">6. Natureza das análises de IA</a></li>
<li><a href="#planos">7. Planos, créditos e pagamento</a></li>
<li><a href="#responsabilidade">8. Limitação de responsabilidade</a></li>
<li><a href="#rescisao">9. Suspensão e encerramento de conta</a></li>
<li><a href="#privacidade">10. Política de Privacidade</a></li>
<li><a href="#terceiros">11. Compartilhamento com terceiros</a></li>
<li><a href="#direitos-titular">12. Seus direitos (LGPD)</a></li>
<li><a href="#seguranca">13. Segurança</a></li>
<li><a href="#alteracoes">14. Alterações a este documento</a></li>
<li><a href="#foro">15. Lei aplicável e foro</a></li>
<li><a href="#contato">16. Contato</a></li>
</ol>
</nav>

<p class="part-label">Parte I — Termos de Uso</p>

<section class="part anchor-offset" id="definicoes">
<h2>1. Definições</h2>
<p>Para facilitar a leitura, usamos alguns termos ao longo deste documento:</p>
<ul>
<li><strong>"Plataforma"</strong> ou <strong>"Escritor.ai"</strong>: o serviço web descrito aqui, incluindo o editor de texto, as análises de IA e todas as funcionalidades associadas.</li>
<li><strong>"Usuário"</strong> ou <strong>"você"</strong>: qualquer pessoa que cria uma conta e utiliza a Plataforma.</li>
<li><strong>"Obra"</strong> ou <strong>"conteúdo do usuário"</strong>: qualquer texto, capítulo, projeto, sinopse ou material que você escreve, importa ou armazena na Plataforma.</li>
<li><strong>"Análise"</strong>: qualquer resultado gerado pela IA a partir da sua Obra — revisão, verificação de continuidade, simulação de leitores, sugestão criativa, entre outros.</li>
<li><strong>"Nós"</strong> ou <strong>"Empresa"</strong>: a pessoa jurídica responsável pela operação do Escritor.ai.</li>
</ul>
</section>

<section class="part anchor-offset" id="objeto">
<h2>2. O que é o Escritor.ai</h2>
<p>O Escritor.ai é uma ferramenta de apoio editorial para escritores de ficção. A Plataforma processa o texto que você fornece e devolve análises, sugestões e simulações de leitura geradas por modelos de linguagem (IA), com o objetivo de ajudar você a revisar, organizar e desenvolver sua Obra.</p>
<div class="callout">
<p>O Escritor.ai <strong>não escreve a sua Obra por você</strong> e não substitui a decisão criativa do autor. Toda sugestão gerada é apenas uma possibilidade a ser avaliada — nunca uma alteração automática do seu texto.</p>
</div>
</section>

<section class="part anchor-offset" id="conta">
<h2>3. Conta e elegibilidade</h2>
<ol class="clauses">
<li>Para usar a Plataforma, você precisa criar uma conta com e-mail válido e passar por verificação via código enviado por e-mail.</li>
<li>Você deve ter <strong>18 anos ou mais</strong> para usar o Escritor.ai. Se identificarmos que uma conta pertence a um menor de idade, ela poderá ser suspensa.</li>
<li>Você é responsável por manter a confidencialidade das credenciais da sua conta e por qualquer atividade realizada nela.</li>
<li>As informações fornecidas no cadastro devem ser verdadeiras. Contas com dados falsos podem ser suspensas sem aviso prévio.</li>
</ol>
</section>

<section class="part anchor-offset" id="propriedade">
<h2>4. Propriedade da sua obra</h2>
<div class="callout">
<p><strong>Todo o conteúdo que você escreve, importa ou armazena no Escritor.ai continua sendo integralmente seu.</strong> Não reivindicamos nenhum direito autoral, de propriedade intelectual ou de exploração comercial sobre sua Obra.</p>
</div>
<ol class="clauses">
<li>Ao enviar um texto para análise, você nos concede apenas uma <strong>licença limitada, não exclusiva e revogável</strong> para processar esse conteúdo — incluindo o envio a provedores de infraestrutura de IA terceirizados — com a única finalidade de gerar a Análise solicitada e manter o funcionamento da Plataforma.</li>
<li>Essa licença não nos autoriza a publicar, comercializar, usar como exemplo público, treinar modelos de IA próprios ou de terceiros, ou de qualquer forma explorar sua Obra além do necessário para prestar o serviço a você.</li>
<li>Você é o único responsável por garantir que possui os direitos sobre o conteúdo que envia à Plataforma (por exemplo, não enviar textos de terceiros sem autorização).</li>
</ol>
</section>

<section class="part anchor-offset" id="uso-aceitavel">
<h2>5. Uso aceitável</h2>
<p>Ao usar o Escritor.ai, você concorda em não:</p>
<ul>
<li>Utilizar a Plataforma para gerar, armazenar ou distribuir conteúdo ilegal, difamatório, ou que viole direitos de terceiros;</li>
<li>Tentar acessar, de forma não autorizada, contas de outros usuários, dados internos ou infraestrutura da Plataforma;</li>
<li>Fazer engenharia reversa, copiar ou revender o funcionamento da Plataforma ou dos prompts/lógica de análise;</li>
<li>Automatizar o uso da Plataforma de forma a burlar os limites de créditos ou os planos de assinatura;</li>
<li>Utilizar a Plataforma de qualquer forma que sobrecarregue, comprometa ou prejudique sua disponibilidade para outros usuários.</li>
</ul>
<p>O descumprimento destas regras pode levar à suspensão ou ao encerramento da conta, conforme a Seção 9.</p>
</section>

<section class="part anchor-offset" id="natureza-ia">
<h2>6. Natureza das análises de IA</h2>
<div class="callout warn">
<p>Este é um dos pontos mais importantes deste documento: <strong>as Análises geradas pelo Escritor.ai são opiniões automatizadas geradas por modelos de linguagem, não avaliações profissionais, jurídicas, editoriais formais ou garantias de qualquer tipo.</strong></p>
</div>
<ol class="clauses">
<li>As simulações de leitor, revisões, sugestões e verificações de continuidade representam estimativas geradas por IA e podem conter <strong>erros, imprecisões ou interpretações equivocadas</strong> do seu texto.</li>
<li>O Escritor.ai não garante que seguir as sugestões da Plataforma resultará em melhor recepção crítica, comercial ou editorial da sua Obra.</li>
<li>A Plataforma <strong>não substitui</strong> a revisão de um profissional humano (revisor, editor, preparador de texto) quando essa revisão for necessária para fins de publicação formal.</li>
<li>Toda decisão sobre incorporar, ignorar ou modificar seu texto com base em uma Análise é exclusivamente sua.</li>
</ol>
</section>

<section class="part anchor-offset" id="planos">
<h2>7. Planos, créditos e pagamento</h2>
<ol class="clauses">
<li>O Escritor.ai opera em modelo de assinatura com planos distintos (gratuito e pagos), cada um com um número de créditos associado. Créditos são consumidos de acordo com o tipo e a profundidade da Análise solicitada.</li>
<li>Os créditos não utilizados dentro de um ciclo de cobrança <strong>não são necessariamente acumulativos</strong> para o ciclo seguinte, salvo indicação em contrário na página de planos vigente no momento da contratação.</li>
<li>Os valores, limites de crédito e funcionalidades de cada plano podem ser ajustados mediante aviso prévio, não afetando ciclos já pagos.</li>
<li>Cancelamentos e reembolsos seguem a política de pagamento vigente, disponível na página de planos, e a legislação de defesa do consumidor aplicável (incluindo o direito de arrependimento em compras via internet, quando aplicável).</li>
</ol>
</section>

<section class="part anchor-offset" id="responsabilidade">
<h2>8. Limitação de responsabilidade</h2>
<ol class="clauses">
<li>O Escritor.ai é fornecido <strong>"como está"</strong> ("as is"), sem garantias de disponibilidade ininterrupta, ausência de erros, ou de que os resultados das Análises atenderão plenamente às expectativas do usuário.</li>
<li>Na máxima extensão permitida pela lei, não nos responsabilizamos por danos indiretos, lucros cessantes, ou prejuízos decorrentes de decisões editoriais, comerciais ou criativas tomadas com base nas Análises fornecidas pela Plataforma.</li>
<li>Não nos responsabilizamos por perda de conteúdo decorrente de falha do usuário em manter cópias de segurança da sua Obra fora da Plataforma. Recomendamos manter backups próprios de textos importantes.</li>
<li>Nada nesta seção exclui responsabilidades que não podem ser limitadas por lei, incluindo as previstas no Código de Defesa do Consumidor.</li>
</ol>
</section>

<section class="part anchor-offset" id="rescisao">
<h2>9. Suspensão e encerramento de conta</h2>
<ol class="clauses">
<li>Você pode encerrar sua conta a qualquer momento, através das configurações da Plataforma ou por solicitação ao nosso contato de suporte.</li>
<li>Podemos suspender ou encerrar contas que violem estes Termos, mediante notificação, exceto em casos de violação grave ou risco à segurança da Plataforma, quando a suspensão poderá ser imediata.</li>
<li>Ao encerrar a conta, você poderá solicitar a exportação da sua Obra dentro de um prazo razoável antes da exclusão definitiva dos dados, conforme detalhado na Política de Privacidade.</li>
</ol>
</section>

<p class="part-label">Parte II — Política de Privacidade</p>

<section class="part anchor-offset" id="privacidade">
<h2>10. Como tratamos seus dados</h2>
<p>Esta seção descreve como coletamos, usamos e armazenamos dados pessoais e conteúdo, em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.</p>

<h3>10.1 Dados que coletamos</h3>
<table>
<thead>
<tr><th>Categoria</th><th>Exemplos</th><th>Finalidade</th></tr>
</thead>
<tbody>
<tr><td>Dados de cadastro</td><td>Nome, e-mail, senha (criptografada)</td><td>Criar e autenticar sua conta</td></tr>
<tr><td>Conteúdo da Obra</td><td>Projetos, capítulos, sinopses, texto importado</td><td>Executar as Análises solicitadas</td></tr>
<tr><td>Dados de uso</td><td>Créditos consumidos, tipos de análise usados, datas de acesso</td><td>Gestão do plano e melhoria do serviço</td></tr>
<tr><td>Dados técnicos</td><td>Endereço IP, tipo de dispositivo, logs de erro</td><td>Segurança e diagnóstico técnico</td></tr>
</tbody>
</table>

<h3>10.2 Base legal para o tratamento</h3>
<p>Tratamos seus dados com base na <strong>execução de contrato</strong> (para viabilizar o serviço que você contratou), no <strong>legítimo interesse</strong> (para segurança e melhoria da Plataforma) e, quando aplicável, no <strong>consentimento</strong> (por exemplo, para comunicações de marketing, que você pode revogar a qualquer momento).</p>

<h3>10.3 Retenção de dados</h3>
<p>Mantemos o conteúdo da sua Obra enquanto sua conta estiver ativa. Após o encerramento da conta, os dados são excluídos dentro do prazo informado nas configurações de conta ou mediante solicitação, exceto quando a retenção for exigida por obrigação legal.</p>
</section>

<section class="part anchor-offset" id="terceiros">
<h2>11. Compartilhamento com terceiros</h2>
<ol class="clauses">
<li>Para gerar as Análises, o texto da sua Obra é enviado a <strong>provedores de infraestrutura de inteligência artificial terceirizados</strong>, contratados para processar as solicitações e retornar o resultado.</li>
<li>Esses provedores atuam como operadores de dados, sob obrigações contratuais de confidencialidade e segurança, e não estão autorizados a usar o conteúdo enviado para treinar seus próprios modelos, exceto quando expressamente informado.</li>
<li>Não vendemos dados pessoais ou conteúdo de Obras a terceiros para fins de publicidade ou qualquer outra finalidade não descrita neste documento.</li>
<li>Podemos compartilhar dados com autoridades quando exigido por lei, ordem judicial ou requisição de órgão competente.</li>
</ol>
</section>

<section class="part anchor-offset" id="direitos-titular">
<h2>12. Seus direitos como titular de dados</h2>
<p>Nos termos da LGPD, você pode, a qualquer momento, solicitar:</p>
<ul>
<li>Confirmação da existência de tratamento de dados;</li>
<li>Acesso aos dados que mantemos sobre você;</li>
<li>Correção de dados incompletos, inexatos ou desatualizados;</li>
<li>Exclusão dos dados pessoais, observadas as exceções legais;</li>
<li>Portabilidade dos dados a outro fornecedor de serviço;</li>
<li>Revogação do consentimento, quando aplicável;</li>
<li>Informação sobre com quem seus dados foram compartilhados.</li>
</ul>
<p>Solicitações podem ser feitas pelo canal indicado na Seção 16.</p>
</section>

<section class="part anchor-offset" id="seguranca">
<h2>13. Segurança da informação</h2>
<p>Adotamos medidas técnicas e organizacionais razoáveis para proteger seus dados, incluindo criptografia de senhas, controle de acesso por autenticação, e segregação de ambientes. Nenhum sistema é 100% livre de risco, e em caso de incidente de segurança relevante, notificaremos os usuários afetados e a Autoridade Nacional de Proteção de Dados (ANPD), conforme exigido por lei.</p>
</section>

<section class="part anchor-offset" id="alteracoes">
<h2>14. Alterações a este documento</h2>
<p>Podemos atualizar estes Termos e esta Política periodicamente, para refletir mudanças no serviço ou na legislação. Alterações relevantes serão comunicadas por e-mail ou aviso na Plataforma, com antecedência razoável antes de entrarem em vigor. O uso continuado da Plataforma após a atualização representa aceite dos novos termos.</p>
</section>

<section class="part anchor-offset" id="foro">
<h2>15. Lei aplicável e foro</h2>
<p>Este documento é regido pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do Usuário para dirimir eventuais controvérsias, exceto se houver disposição legal específica em contrário, respeitando os direitos do consumidor.</p>
</section>

<section class="part anchor-offset" id="contato">
<h2>16. Contato</h2>
<p>Dúvidas sobre estes Termos, sobre a Política de Privacidade, ou solicitações relacionadas aos seus dados pessoais podem ser enviadas para <strong>privacidade@escritor.ai</strong>.</p>
<a class="back-to-top" href="#definicoes">↑ Voltar ao topo</a>
</section>

<footer class="doc-footer">
<p>Escritor.ai — Este documento é um modelo de referência e não substitui a revisão de um advogado antes da publicação oficial.</p>
</footer>

</div>
`;

export default function Terms() {
  return (
    <div className="terms-doc">
      <style>{TERMS_STYLES}</style>

      <div className="top-nav">
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="Escritor.ia" style={{ width: 24, height: 24, borderRadius: 6 }} />
        </a>
        <a href="/" className="btn btn-ghost btn-sm" style={{ color: "#6b6788" }}>
          ← Voltar
        </a>
      </div>

      <div dangerouslySetInnerHTML={{ __html: TERMS_CONTENT }} />
    </div>
  );
}
