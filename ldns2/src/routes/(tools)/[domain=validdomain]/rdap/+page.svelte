<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { onMount } from "svelte";
    import ToolPage from "$lib/components/ToolPage.svelte";
    import DataTable from "$lib/components/DataTable.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import SectionHeader from "$lib/components/SectionHeader.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import StatStrip from "$lib/components/StatStrip.svelte";
    import { page } from "$app/stores";
    import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
    import { generateRdapFaqJsonLd } from "$lib/utils/faqJsonLd";
    
    // Helper functions for domain age and expiration calculations
    function calculateDomainAge(createdDate: string | undefined) {
        if (!createdDate) return null;
        const created = new Date(createdDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            totalDays: diffDays,
            years: Math.floor(diffDays / 365),
            months: Math.floor((diffDays % 365) / 30),
            days: diffDays % 30,
            createdDate: created.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        };
    }
    
    function calculateExpiration(expirationDate: string | undefined) {
        if (!expirationDate) return null;
        const expires = new Date(expirationDate);
        const now = new Date();
        const diffTime = expires.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return {
                expired: true,
                days: Math.abs(diffDays),
                months: 0,
                expirationDate: expires.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            };
        }
        
        return {
            expired: false,
            days: diffDays % 30,
            months: Math.floor(diffDays / 30),
            expirationDate: expires.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            isUrgent: diffDays <= 30,
            isCritical: diffDays <= 7
        };
    }
    
    // Get registrar from entities
    function getRegistrar(entities: any[] | undefined) {
        if (!entities || entities.length === 0) return null;
        
        // Look for entity with registrar role
        const registrarEntity = entities.find((entity: any) => 
            entity.roles?.includes('registrar') || 
            entity.role === 'registrar'
        );
        
        if (registrarEntity) {
            return registrarEntity.name || registrarEntity.handle || 'Unknown Registrar';
        }
        
        return null;
    }

    // Generate FAQ JSON-LD when RDAP data is available
    const faqJsonLd = $derived(
        domain.toolState.rdap.hasData 
            ? generateRdapFaqJsonLd(domain.name, domain.toolState.rdap.data)
            : null
    );

    // Look up RDAP data - exactly like DNS lookupAllRecords
    async function lookupRdapData() {
        try {
            await domain.lookupRdap();
        } catch (error) {
            console.error("RDAP lookup error:", error);
        }
    }

    // Handle refresh - exactly like DNS handleRefresh
    async function handleRefresh() {
        await domain.refreshTool("rdap");
    }

    // Load data on mount - exactly like DNS onMount
    onMount(() => {
        if (!domain.toolState.rdap.hasData && !domain.toolState.rdap.loading) {
            lookupRdapData();
        }
    });

    // Format RDAP data for display - Svelte 5 compatible functions
    function getRdapTableData() {
        return domain.toolState.rdap.data
            ? [
                  {
                      key: "Domain",
                      value: domain.toolState.rdap.data.domainName || "N/A",
                  },
                  {
                      key: "Status",
                      value: domain.toolState.rdap.data.status?.join(", ") || "N/A",
                  },
                  {
                      key: "Created",
                      value: domain.toolState.rdap.data.created
                          ? new Date(
                                domain.toolState.rdap.data.created,
                            ).toLocaleDateString()
                          : "N/A",
                  },
                  {
                      key: "Updated",
                      value: domain.toolState.rdap.data.updated
                          ? new Date(
                                domain.toolState.rdap.data.updated,
                            ).toLocaleDateString()
                          : "N/A",
                  },
                  {
                      key: "Expires",
                      value: domain.toolState.rdap.data.expires
                          ? new Date(
                                domain.toolState.rdap.data.expires,
                            ).toLocaleDateString()
                          : "N/A",
                  },
                  {
                      key: "Registrar",
                      value: domain.toolState.rdap.data.registrar || getRegistrar(domain.toolState.rdap.data?.entities) || "N/A",
                  },
                  {
                      key: "DNSSEC",
                      value: domain.toolState.rdap.data.dnssecEnabled ? "Enabled" : "Disabled",
                  },
                  {
                      key: "RDAP Server",
                      value: domain.toolState.rdap.data.rdapServer || "N/A",
                  },
              ]
            : [];
    }

    function getEventsTableData() {
        return (
            domain.toolState.rdap.data?.events?.map((event: any) => ({
                action: event.action,
                date: event.date
                    ? new Date(event.date).toLocaleDateString()
                    : "N/A",
            })) || []
        );
    }

    function getNameserversTableData() {
        return (
            domain.toolState.rdap.data?.nameservers?.map((ns: string) => ({
                nameserver: ns,
            })) || []
        );
    }

    function getEntitiesTableData() {
        return (
            domain.toolState.rdap.data?.entities?.map((entity: any) => ({
                entity: entity.handle || entity.name || "Unknown Entity",
                role: entity.role || "No roles",
                details: [
                    entity.name && `Name: ${entity.name}`,
                    entity.org && `Organization: ${entity.org}`,
                    entity.email && `Email: ${entity.email}`,
                    entity.tel && `Phone: ${entity.tel}`,
                    entity.country && `Country: ${entity.country}`
                ].filter(Boolean).join(", ") || "No details available"
            })) || []
        );
    }
</script>

<SEO 
    title="{$page.params.domain} RDAP Lookup" 
    description="Access RDAP registration data for {$page.params.domain}. View domain registration details, nameservers, contact information, and registration history through the Registration Data Access Protocol."
/>

<FaqJsonLd faqData={faqJsonLd} />

<ToolPage
    eyebrow="rdap · registration"
    title="{domain.name} RDAP Lookup"
    domainName={domain.name}
    isLoading={domain.toolState.rdap.loading}
    error={domain.toolState.rdap.error}
>
    {#snippet actions()}
        <div class="flex gap-2">
            <ShareButton />
            <RefreshButton
                onClick={handleRefresh}
                loading={domain.toolState.rdap.loading}
                variant="secondary"
            />
        </div>
    {/snippet}

    <div class="space-y-8">
        <!-- RDAP Summary -->
        {#if domain.toolState.rdap.data}
            {@const domainAge = calculateDomainAge(domain.toolState.rdap.data?.created)}
            {@const expiration = calculateExpiration(domain.toolState.rdap.data?.expires)}
            {@const registrar = getRegistrar(domain.toolState.rdap.data?.entities)}
            
            <StatStrip
                stats={[
                    {
                        label: 'Age',
                        value: domainAge ? `${domainAge.years}y ${domainAge.months}m` : 'Unknown',
                        sub: domainAge ? `since ${domainAge.createdDate}` : undefined
                    },
                    {
                        label: 'Expires',
                        value: expiration
                            ? expiration.expired
                                ? 'Expired'
                                : `${expiration.months}m ${expiration.days}d`
                            : 'Unknown',
                        sub: expiration ? expiration.expirationDate : undefined,
                        tone: expiration
                            ? expiration.expired || expiration.isCritical
                                ? 'bad'
                                : expiration.isUrgent
                                  ? 'warn'
                                  : undefined
                            : undefined
                    },
                    {
                        label: 'Registrar',
                        value: registrar || domain.toolState.rdap.data?.registrar || 'Unknown'
                    },
                    {
                        label: 'DNSSEC',
                        value: domain.toolState.rdap.data?.dnssecEnabled ? 'Enabled' : 'Disabled',
                        tone: domain.toolState.rdap.data?.dnssecEnabled ? 'ok' : undefined
                    }
                ]}
            />
        {/if}
        
        <!-- Domain Information -->
        <div>
            <SectionHeader id="domain-info" title="Domain Information" />
            <DataTable
                title=""
                data={getRdapTableData()}
                columns={[
                    { key: "key", label: "Property", width: "200px" },
                    { key: "value", label: "Value" },
                ]}
                enableCopy={true}
                copyColumn="value"
                highlightColumns={["value"]}
            />
        </div>

        <!-- Events -->
        {#if getEventsTableData().length > 0}
            <div class="mb-8">
                <SectionHeader id="events" title="Domain Events" />
                <DataTable
                    title=""
                    data={getEventsTableData()}
                    columns={[
                        { key: "action", label: "Action", width: "200px" },
                        { key: "date", label: "Date" },
                    ]}
                    enableCopy={true}
                    copyColumn="date"
                    highlightColumns={["date"]}
                />
            </div>
        {/if}

        <!-- Nameservers -->
        {#if getNameserversTableData().length > 0}
            <div class="mb-8">
                <SectionHeader id="nameservers" title="Nameservers" />
                <DataTable
                    title=""
                    data={getNameserversTableData()}
                    columns={[{ key: "nameserver", label: "Nameserver" }]}
                    enableCopy={true}
                    copyColumn="nameserver"
                    highlightColumns={["nameserver"]}
                />
            </div>
        {/if}

        <!-- Entities/Contacts -->
        {#if getEntitiesTableData().length > 0}
            <div class="mb-8">
                <SectionHeader id="entities" title="Registry Entities" />
                <DataTable
                    title=""
                    data={getEntitiesTableData()}
                    columns={[
                        { key: "entity", label: "Entity", width: "200px" },
                        { key: "role", label: "Role", width: "150px" },
                        { key: "details", label: "Details" },
                    ]}
                    enableCopy={true}
                    copyColumn="details"
                    highlightColumns={["details"]}
                />
            </div>
        {/if}

        <!-- DNSSEC Details -->
        {#if domain.toolState.rdap.data?.dnssecEnabled && domain.toolState.rdap.data?.dnssecData}
            <div class="mb-8">
                <SectionHeader id="dnssec" title="DNSSEC Details" />
                {#if domain.toolState.rdap.data.dnssecData.dsData && domain.toolState.rdap.data.dnssecData.dsData.length > 0}
                    <DataTable
                        title="DS Records"
                        data={domain.toolState.rdap.data.dnssecData.dsData.map((ds: any) => ({
                            keyTag: ds.keyTag,
                            algorithm: `${ds.algorithm} (${getDnssecAlgorithmName(ds.algorithm)})`,
                            digestType: `${ds.digestType} (${getDnssecDigestTypeName(ds.digestType)})`,
                            digest: ds.digest
                        }))}
                        columns={[
                            { key: "keyTag", label: "Key Tag", width: "100px" },
                            { key: "algorithm", label: "Algorithm", width: "200px" },
                            { key: "digestType", label: "Digest Type", width: "150px" },
                            { key: "digest", label: "Digest" },
                        ]}
                        enableCopy={true}
                        copyColumn="digest"
                        highlightColumns={["digest"]}
                    />
                {/if}
            </div>
        {/if}
    </div>
</ToolPage>

<script module lang="ts">
    function getDnssecAlgorithmName(algorithm: number): string {
        const algorithms: Record<number, string> = {
            3: 'DSA',
            5: 'RSA/SHA-1',
            6: 'DSA-NSEC3-SHA1',
            7: 'RSASHA1-NSEC3-SHA1',
            8: 'RSA/SHA-256',
            10: 'RSA/SHA-512',
            12: 'GOST R 34.10-2001',
            13: 'ECDSA Curve P-256 with SHA-256',
            14: 'ECDSA Curve P-384 with SHA-384',
            15: 'Ed25519',
            16: 'Ed448'
        };
        return algorithms[algorithm] || 'Unknown';
    }

    function getDnssecDigestTypeName(digestType: number): string {
        const types: Record<number, string> = {
            1: 'SHA-1',
            2: 'SHA-256',
            3: 'GOST R 34.11-94',
            4: 'SHA-384'
        };
        return types[digestType] || 'Unknown';
    }
</script>
