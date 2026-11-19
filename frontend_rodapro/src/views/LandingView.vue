<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import http from '../api/http';
import { useTienda } from '../composables/useTienda';
import { bs } from '../utils/format';
import type { CatalogoCategoria, CatalogoProducto, Paginado } from '../types';

const router = useRouter();
const tienda = useTienda();

const busqueda = ref('');
const categorias = ref<CatalogoCategoria[]>([]);
const destacados = ref<CatalogoProducto[]>([]);

onMounted(async () => {
  // Las secciones dinámicas son opcionales: si la API falla, la landing igual se ve completa.
  const [cats, prods] = await Promise.allSettled([
    http.get<CatalogoCategoria[]>('/catalogo/categorias'),
    http.get<Paginado<CatalogoProducto>>('/catalogo/productos', { params: { soloDisponibles: true, limit: 8 } }),
  ]);
  if (cats.status === 'fulfilled') categorias.value = cats.value.data;
  if (prods.status === 'fulfilled') destacados.value = prods.value.data.items;
});

function buscar(): void {
  void router.push({ name: 'catalogo', query: busqueda.value.trim() ? { q: busqueda.value.trim() } : {} });
}

const icono = (nombre: string): string => {
  const n = nombre.toLowerCase();
  if (n.includes('freno')) return 'bi-disc';
  if (n.includes('filtro')) return 'bi-funnel';
  if (n.includes('lubric') || n.includes('aceite')) return 'bi-droplet-half';
  if (n.includes('suspens')) return 'bi-arrows-vertical';
  if (n.includes('eléctr') || n.includes('electr')) return 'bi-lightning-charge';
  if (n.includes('motor')) return 'bi-gear-wide-connected';
  return 'bi-wrench-adjustable';
};

const chips = computed(() => categorias.value.slice(0, 5));
const whatsappDigits = computed(() => (tienda.value?.whatsapp ?? '').replace(/\D/g, ''));
const whatsappUrl = computed(() =>
  whatsappDigits.value
    ? `https://wa.me/${whatsappDigits.value}?text=${encodeURIComponent('Hola, quisiera consultar por un repuesto para mi vehículo.')}`
    : '',
);
const copiado = ref(false);
async function copiarDireccion(): Promise<void> {
  try {
    await navigator.clipboard.writeText(tienda.value?.direccion ?? '');
    copiado.value = true;
    setTimeout(() => (copiado.value = false), 2000);
  } catch {
    /* sin permiso de portapapeles: no pasa nada */
  }
}
const telefonoHref = computed(() => (tienda.value?.telefono ?? '').replace(/[^\d+]/g, ''));

const valores = [
  { icono: 'bi-cash-coin', titulo: 'Precios en bolivianos', texto: 'Cada producto muestra su precio de venta, sin sorpresas.' },
  { icono: 'bi-box-seam', titulo: 'Disponibilidad a la vista', texto: 'Vea si hay stock, si quedan pocas unidades o si está agotado.' },
  { icono: 'bi-list-check', titulo: 'Una sola lista', texto: 'Agregue varios repuestos y consulte todo en un solo mensaje.' },
  { icono: 'bi-shop', titulo: 'Atención en tienda', texto: 'Pase por el local y revise la pieza con nosotros.' },
];
const pasos = [
  { titulo: 'Busque', texto: 'Encuentre el repuesto por nombre, marca o código.' },
  { titulo: 'Arme su lista', texto: 'Agregue los productos y ajuste las cantidades.' },
  { titulo: 'Confirme con la tienda', texto: 'Envíe la lista por WhatsApp o pase por el local. Confirmamos disponibilidad y precio final.' },
];
const ficha = computed(() => [
  { k: 'Rubro', v: 'Repuestos mecánicos para vehículos livianos' },
  { k: 'Ubicación', v: tienda.value?.direccion || 'Sucre, Bolivia' },
  { k: 'Atención', v: 'En el local y por WhatsApp' },
  { k: 'Precios', v: 'En bolivianos (Bs), a la vista en el catálogo' },
  { k: 'Stock', v: 'Cada entrada y salida queda registrada en inventario' },
]);
const etiquetaDisp = (d: CatalogoProducto['disponibilidad']): string =>
  d === 'POCO_STOCK' ? 'Pocas unidades' : d === 'AGOTADO' ? 'Agotado' : 'Disponible';
</script>

<template>
  <!-- Hero -->
  <section id="inicio" class="lp-hero">
    <div class="container">
      <div class="row align-items-center g-5">
        <div class="col-lg-7">
          <h1 class="lp-h1">Repuestos mecánicos en Sucre, con precio claro</h1>
          <p class="lp-lead">Frenos, filtros, lubricantes, suspensión y más. Busque el repuesto, arme su lista y confirme la disponibilidad por WhatsApp.</p>

          <form class="lp-order" role="search" @submit.prevent="buscar">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input v-model="busqueda" type="search" placeholder="Busque por nombre, marca o código" aria-label="Buscar repuestos" />
            <button class="btn btn-primary px-4">Buscar repuestos</button>
          </form>

          <div v-if="chips.length" class="lp-chips">
            <router-link v-for="c in chips" :key="c.id" :to="{ name: 'catalogo', query: { categoria: c.id } }" class="lp-chip">{{ c.nombre }}</router-link>
          </div>
        </div>

        <div class="col-lg-5">
          <!-- Despiece de un conjunto de freno: pernos, pastillas y disco -->
          <svg class="lp-explode" viewBox="0 0 600 480" role="img" aria-label="Despiece de un freno de disco: pernos, pastillas y disco ventilado">
            <line class="lp-axis" x1="240" y1="24" x2="240" y2="456" />

            <g class="lp-disc">
              <path d="M90 360v18a150 56 0 0 0 300 0v-18z" fill="#d5dce3" stroke="#1b2a3b" stroke-width="2" />
              <ellipse cx="240" cy="360" rx="150" ry="56" fill="#f8fafb" stroke="#1b2a3b" stroke-width="2" />
              <ellipse cx="240" cy="360" rx="120" ry="44" fill="none" stroke="#8a96a3" stroke-width="1.5" stroke-dasharray="3 5" />
              <ellipse cx="240" cy="360" rx="56" ry="22" fill="#e3e8ed" stroke="#1b2a3b" stroke-width="2" />
              <ellipse cx="240" cy="360" rx="20" ry="8" fill="#1b2a3b" />
              <ellipse cx="240" cy="346" rx="5" ry="2.2" fill="#1b2a3b" />
              <ellipse cx="274" cy="356" rx="5" ry="2.2" fill="#1b2a3b" />
              <ellipse cx="261" cy="371" rx="5" ry="2.2" fill="#1b2a3b" />
              <ellipse cx="219" cy="371" rx="5" ry="2.2" fill="#1b2a3b" />
              <ellipse cx="206" cy="356" rx="5" ry="2.2" fill="#1b2a3b" />
            </g>

            <g class="lp-pad">
              <path d="M132 236C156 204 324 204 348 236L342 250C318 224 162 224 138 250Z" fill="#c9d1d9" stroke="#1b2a3b" stroke-width="2" stroke-linejoin="round" />
              <path d="M138 250C162 224 318 224 342 250L338 266C316 242 164 242 142 266Z" fill="#e8590c" stroke="#1b2a3b" stroke-width="2" stroke-linejoin="round" />
              <path d="M200 238l-3 14M240 234v14M280 238l3 14" stroke="#1b2a3b" stroke-width="1.5" opacity=".55" />
            </g>

            <g class="lp-bolts">
              <rect x="164" y="104" width="12" height="52" fill="#c9d1d9" stroke="#1b2a3b" stroke-width="2" />
              <path d="M164 118h12M164 128h12M164 138h12M164 148h12" stroke="#1b2a3b" stroke-width="1.2" />
              <ellipse cx="170" cy="100" rx="20" ry="8" fill="#e3e8ed" stroke="#1b2a3b" stroke-width="2" />
              <rect x="304" y="104" width="12" height="52" fill="#c9d1d9" stroke="#1b2a3b" stroke-width="2" />
              <path d="M304 118h12M304 128h12M304 138h12M304 148h12" stroke="#1b2a3b" stroke-width="1.2" />
              <ellipse cx="310" cy="100" rx="20" ry="8" fill="#e3e8ed" stroke="#1b2a3b" stroke-width="2" />
            </g>

            <g class="lp-callout">
              <line class="lp-leader" x1="330" y1="100" x2="412" y2="100" /><circle class="lp-dot" cx="330" cy="100" r="4" />
              <text class="lp-label" x="420" y="106">Pernos</text>
              <line class="lp-leader" x1="348" y1="236" x2="412" y2="236" /><circle class="lp-dot" cx="348" cy="236" r="4" />
              <text class="lp-label" x="420" y="242">Pastillas</text>
              <line class="lp-leader" x1="390" y1="360" x2="412" y2="360" /><circle class="lp-dot" cx="390" cy="360" r="4" />
              <text class="lp-label" x="420" y="366">Disco ventilado</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  </section>

  <!-- Valores -->
  <section class="lp-strip" aria-label="Por qué comprar con RODAPRO">
    <div v-for="v in valores" :key="v.titulo">
      <i class="bi" :class="v.icono" aria-hidden="true"></i>
      <h3 class="lp-h3 mt-2">{{ v.titulo }}</h3>
      <p>{{ v.texto }}</p>
    </div>
  </section>

  <!-- Categorías -->
  <section v-if="categorias.length" id="categorias" class="lp-section">
    <div class="container">
      <div class="lp-head">
        <div>
          <h2 class="lp-h2">Explore por categoría</h2>
          <p class="lp-sub mb-0">Elija una categoría para ver solo los repuestos que le interesan.</p>
        </div>
      </div>
      <div class="lp-cats">
        <router-link v-for="c in categorias" :key="c.id" :to="{ name: 'catalogo', query: { categoria: c.id } }" class="lp-cat">
          <i class="bi ic" :class="icono(c.nombre)" aria-hidden="true"></i>
          <span class="nm">{{ c.nombre }}</span>
          <span class="ct">{{ c.total }} {{ c.total === 1 ? 'producto' : 'productos' }}</span>
          <i class="bi bi-chevron-right go" aria-hidden="true"></i>
        </router-link>
      </div>
    </div>
  </section>

  <!-- Productos disponibles -->
  <section v-if="destacados.length" id="productos" class="lp-section lp-section--white">
    <div class="container">
      <div class="lp-head">
        <div>
          <h2 class="lp-h2">Productos disponibles ahora</h2>
          <p class="lp-sub mb-0">Una muestra del catálogo con stock en tienda.</p>
        </div>
        <router-link :to="{ name: 'catalogo' }" class="btn btn-outline-primary">Ver todo el catálogo</router-link>
      </div>
      <div class="row g-3">
        <div v-for="p in destacados" :key="p.id" class="col-6 col-lg-3">
          <router-link :to="{ name: 'catalogo', query: { q: p.codigo } }" class="lp-tag">
            <div class="lp-tag-code"><span>{{ p.codigo }}</span><span>{{ etiquetaDisp(p.disponibilidad) }}</span></div>
            <div class="lp-tag-body">
              <span class="lp-tag-name">{{ p.nombre }}</span>
              <span class="lp-tag-meta">{{ p.marca || 'Sin marca' }} · {{ p.categoria.nombre }}</span>
              <span class="lp-tag-price">{{ bs(p.precioVenta) }} <small>/ {{ p.unidadMedida.toLowerCase() }}</small></span>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </section>

  <!-- Nosotros -->
  <section id="nosotros" class="lp-section">
    <div class="container">
      <div class="lp-about">
        <div>
          <h2 class="lp-h2">Nosotros</h2>
          <p class="lp-sub">Somos una tienda de repuestos mecánicos en Sucre. Atendemos a quien necesita reparar o mantener su vehículo, ya sea un conductor, un taller o un mecánico.</p>
          <p class="lp-prose">Trabajamos con frenos, filtros, lubricantes, suspensión, sistema eléctrico y piezas de motor. Mantenemos el inventario al día para que usted sepa qué hay en tienda antes de venir, y cada repuesto tiene su precio publicado.</p>
          <p class="lp-prose">Si no está seguro de qué pieza necesita, cuéntenos el modelo y el año de su vehículo. Le ayudamos a confirmar que el repuesto sea el correcto.</p>
          <router-link :to="{ name: 'catalogo' }" class="btn btn-outline-primary mt-2">Ver el catálogo</router-link>
        </div>
        <dl class="lp-ficha" aria-label="Datos de la tienda">
          <div v-for="f in ficha" :key="f.k"><dt>{{ f.k }}</dt><dd>{{ f.v }}</dd></div>
        </dl>
      </div>
    </div>
  </section>

  <!-- Cómo pedir -->
  <section id="como-pedir" class="lp-section lp-section--white">
    <div class="container">
      <h2 class="lp-h2 mb-4">Cómo pedir su repuesto</h2>
      <div class="lp-steps">
        <div v-for="(paso, i) in pasos" :key="paso.titulo" class="lp-step">
          <div class="n">{{ i + 1 }}</div>
          <h3 class="lp-h3">{{ paso.titulo }}</h3>
          <p>{{ paso.texto }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Visítenos -->
  <section id="visitenos" class="lp-section">
    <div class="container">
      <div class="lp-visit">
        <div>
          <h2 class="lp-h2">Visítenos en Sucre</h2>
          <p class="lp-sub">Pase por el local para ver la pieza antes de llevarla.</p>
          <ul class="lp-info">
            <li v-if="tienda?.direccion">
              <i class="bi bi-geo-alt" aria-hidden="true"></i><span>{{ tienda.direccion }}</span>
              <button type="button" class="lp-copy" @click="copiarDireccion">{{ copiado ? 'Copiada' : 'Copiar' }}</button>
            </li>
            <li v-if="tienda?.horarios?.length">
              <i class="bi bi-clock" aria-hidden="true"></i>
              <span><span v-for="h in tienda.horarios" :key="h" class="d-block">{{ h }}</span></span>
            </li>
            <li v-if="tienda?.telefono"><i class="bi bi-telephone" aria-hidden="true"></i><a :href="`tel:${telefonoHref}`">{{ tienda.telefono }}</a></li>
            <li v-if="whatsappUrl"><i class="bi bi-whatsapp" aria-hidden="true"></i><a :href="whatsappUrl" target="_blank" rel="noopener">Escribir por WhatsApp</a></li>
          </ul>
        </div>
        <div class="lp-address">
          <div>
            <div class="text-white-50 mb-1">Dirección</div>
            <div class="big">{{ tienda?.direccion || 'Sucre, Bolivia' }}</div>
          </div>
          <div v-if="tienda?.mapaEmbedUrl" class="lp-map">
            <iframe :src="tienda.mapaEmbedUrl" title="Ubicación de RODAPRO en Sucre" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <a v-if="tienda?.mapaUrl" :href="tienda.mapaUrl" target="_blank" rel="noopener" class="btn btn-light"><i class="bi bi-map me-1"></i>Ver cómo llegar</a>
            <router-link :to="{ name: 'catalogo' }" class="btn btn-outline-light">Ver catálogo</router-link>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Cierre -->
  <section class="lp-cta">
    <div class="container d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div>
        <h2 class="lp-h2">¿No encuentra su repuesto?</h2>
        <p class="lp-sub mb-0">Escríbanos el modelo de su vehículo y le decimos si lo tenemos.</p>
      </div>
      <a v-if="whatsappUrl" :href="whatsappUrl" target="_blank" rel="noopener" class="btn btn-primary btn-lg"><i class="bi bi-whatsapp me-2"></i>Escribir por WhatsApp</a>
      <router-link v-else :to="{ name: 'catalogo' }" class="btn btn-primary btn-lg">Ver catálogo</router-link>
    </div>
  </section>
</template>
