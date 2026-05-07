/**
 * productMain() — Alpine.js component for product-main.liquid
 * Handles media gallery, variant selection, quantity, and add-to-cart
 */

function productMain() {
  return {
    /* ===== STATE ===== */
    activeIndex: 0,
    activeMediaId: null,
    mediaCount: 0,
    selectedVariantId: null,
    currentOptionValues: [],
    quantity: 1,
    isAddingToCart: false,
    isVariantAvailable: true,
    currentPrice: 0,
    touchStartX: 0,
    touchStartTime: 0,

    productData: null,
    variants: [],
    productOptions: [],

    /* ===== LIFECYCLE ===== */
    init() {
      const sectionId = this.$el.getAttribute('data-section-id');
      const dataScript = document.querySelector(`#product-data-${sectionId}`);
      const variantsScript = document.querySelector(`#product-variants-${sectionId}`);

      if (!dataScript || !variantsScript) return;

      this.productData = JSON.parse(dataScript.textContent);
      this.variants = JSON.parse(variantsScript.textContent);
      this.mediaCount = this.productData.mediaCount;
      this.activeMediaId = this.productData.firstMediaId;
      this.selectedVariantId = this.productData.initialVariantId;

      this.initializeOptions();
      this.updatePriceDisplay();
    },

    initializeOptions() {
      const currentVariant = this.variants.find(v => v.id === this.selectedVariantId);
      if (!currentVariant) return;

      const optionsCount = this.variants[0]?.option1 ? 1 : 0;
      if (this.variants[0]?.option2) this.optionsCount++;
      if (this.variants[0]?.option3) this.optionsCount++;

      this.currentOptionValues = [
        currentVariant.option1 || null,
        currentVariant.option2 || null,
        currentVariant.option3 || null,
      ].filter(v => v !== null);
    },

    /* ===== MEDIA CAROUSEL ===== */
    goToMedia(mediaId) {
      this.activeMediaId = mediaId;
      const mediaElements = this.$el.querySelectorAll('[data-media-id]');
      const index = Array.from(mediaElements).findIndex(el => el.getAttribute('data-media-id') === String(mediaId));
      if (index !== -1) this.activeIndex = index;
    },

    handleTouchStart(e) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartTime = Date.now();
    },

    handleTouchEnd(e) {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = this.touchStartX - touchEndX;
      const deltaTime = Date.now() - this.touchStartTime;

      if (Math.abs(deltaX) < 50 || deltaTime > 500) return;

      const mediaElements = this.$el.querySelectorAll('[data-media-id]');
      const nextIndex = deltaX > 0
        ? Math.min(this.activeIndex + 1, mediaElements.length - 1)
        : Math.max(this.activeIndex - 1, 0);

      if (nextIndex !== this.activeIndex) {
        this.activeIndex = nextIndex;
        this.activeMediaId = parseInt(mediaElements[nextIndex].getAttribute('data-media-id'));
      }
    },

    /* ===== VARIANT SELECTION ===== */
    updateOption(optionIndex, value) {
      this.$nextTick(() => {
        this.currentOptionValues[optionIndex] = value;
        const variant = this.findVariantByOptions();
        if (variant) {
          this.selectedVariantId = variant.id;
          this.isVariantAvailable = variant.available;
          this.updatePriceDisplay();
          if (variant.featured_media) {
            this.goToMedia(variant.featured_media.id);
          }
        }
      });
    },

    variantExists(value, optionIndex) {
      return this.variants.some(v => {
        const optionKey = `option${optionIndex + 1}`;
        if (v[optionKey] !== value) return false;
        for (let i = 0; i < this.currentOptionValues.length; i++) {
          if (i !== optionIndex && this.currentOptionValues[i] !== null) {
            const key = `option${i + 1}`;
            if (v[key] !== this.currentOptionValues[i]) return false;
          }
        }
        return true;
      });
    },

    findVariantByOptions() {
      return this.variants.find(v => {
        return this.currentOptionValues.every((value, idx) => {
          const optionKey = `option${idx + 1}`;
          return value === null || v[optionKey] === value;
        });
      });
    },

    updatePriceDisplay() {
      const variant = this.variants.find(v => v.id === this.selectedVariantId);
      if (variant) {
        this.currentPrice = variant.price;
        this.isVariantAvailable = variant.available;
      }
    },

    /* ===== CART ===== */
    addToCart(e) {
      e.preventDefault();
      this.isAddingToCart = true;

      const form = this.$el.querySelector('form[id*="product-form"]');
      if (!form) {
        this.isAddingToCart = false;
        return;
      }

      fetch(form.action || '/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          items: [
            {
              id: this.selectedVariantId,
              quantity: this.quantity,
            },
          ],
        }),
      })
        .then(res => res.json())
        .then(data => {
          window.location.href = '/cart';
        })
        .catch(err => {
          console.error('Add to cart error:', err);
          this.isAddingToCart = false;
        });
    },

    /* ===== UTILITIES ===== */
    formatMoney(cents) {
      if (!cents) return '€0.00';
      const euros = (cents / 100).toFixed(2);
      return `€${euros}`;
    },
  };
}

/* Register with Alpine.js */
document.addEventListener('alpine:init', () => {
  Alpine.data('productMain', productMain);
});
