<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { onMount } from "svelte";
    import ToolPage from "$lib/components/ToolPage.svelte";
    import DataTable from "$lib/components/DataTable.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import SectionHeader from "$lib/components/SectionHeader.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import Badge from "$lib/components/ui/badge.svelte";
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
    
    // Get primary domain status
    function getPrimaryStatus(statuses: string[] | undefined) {
        if (!statuses || statuses.length === 0) return null;
        
        // Status explanations from RFC 7483
        const statusExplanations: Record<string, string> = {
            'active': 'Domain is operational and can be used normally',
            'inactive': 'Domain exists but is not operational or resolving',
            'locked': 'Domain is locked and cannot be modified by anyone',
            'pendingCreate': 'Domain registration is being processed',
            'pendingRenew': 'Domain renewal is being processed',
            'pendingTransfer': 'Domain transfer to new registrar is in progress', 
            'pendingUpdate': 'Domain information changes are being processed',
            'pendingDelete': 'Domain deletion is scheduled and being processed',
            'clientTransferProhibited': 'Domain cannot be transferred to another registrar - protection enabled by current registrar',
            'client transfer prohibited': 'Domain cannot be transferred to another registrar - protection enabled by current registrar',
            'serverTransferProhibited': 'Domain cannot be transferred to another registrar - protection enabled by registry',
            'server transfer prohibited': 'Domain cannot be transferred to another registrar - protection enabled by registry',
            'clientUpdateProhibited': 'Domain information cannot be updated - protection enabled by current registrar',
            'client update prohibited': 'Domain information cannot be updated - protection enabled by current registrar',
            'serverUpdateProhibited': 'Domain information cannot be updated - protection enabled by registry',
            'server update prohibited': 'Domain information cannot be updated - protection enabled by registry',
            'clientDeleteProhibited': 'Domain cannot be deleted - protection enabled by current registrar to prevent accidental loss',
            'client delete prohibited': 'Domain cannot be deleted - protection enabled by current registrar to prevent accidental loss',
            'serverDeleteProhibited': 'Domain cannot be deleted - protection enabled by registry to prevent accidental loss',
            'server delete prohibited': 'Domain cannot be deleted - protection enabled by registry to prevent accidental loss',
            'clientHold': 'Domain is suspended by registrar - may not resolve or be usable',
            'client hold': 'Domain is suspended by registrar - may not resolve or be usable',
            'serverHold': 'Domain is suspended by registry - may not resolve or be usable',
            'server hold': 'Domain is suspended by registry - may not resolve or be usable',
            'ok': 'Domain has no restrictions and operates normally'
        };
        
        // Priority order for showing status
        const priorityStatuses = ['active', 'clientHold', 'serverHold', 'pendingDelete', 'pendingTransfer', 'ok'];
        
        // Check for priority statuses first
        for (const priority of priorityStatuses) {
            if (statuses.includes(priority)) {
                return {
                    status: priority,
                    explanation: statusExplanations[priority]
                };
            }
        }
        
        // If no priority status, return the first one with its explanation
        const firstStatus = statuses[0];
        return {
            status: firstStatus,
            explanation: statusExplanations[firstStatus] || `Status: ${firstStatus}`
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
    title="{domain.name} RDAP Lookup"
    description="RDAP lookup for {domain.name} — domain registration data, DNSSEC status, and registrar details"
    domainName={domain.name}
    isLoading={domain.toolState.rdap.loading}
    error={domain.toolState.rdap.error}
    badge={{
        text: "RDAP Registry",
        color: "blue",
    }}
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
            {@const primaryStatus = getPrimaryStatus(domain.toolState.rdap.data?.status)}
            {@const registrar = getRegistrar(domain.toolState.rdap.data?.entities)}
            
            <div class="space-y-3 mb-8">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-fg">RDAP Lookup Summary</h3>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <!-- Domain Age Card -->
                    <div class="bg-surface-2 rounded-lg p-3 border border-line">
                        <Badge color="blue" class="text-sm font-medium mb-2">
                            Age
                        </Badge>
                        <p class="text-lg font-bold text-fg">
                            {#if domainAge}
                                {domainAge.years} years, {domainAge.months} months
                            {:else}
                                <span class="text-fg-subtle">Unknown</span>
                            {/if}
                        </p>
                        <p class="text-xs text-fg-muted">
                            {#if domainAge}
                                Since {domainAge.createdDate}
                            {:else}
                                Creation date unknown
                            {/if}
                        </p>
                    </div>

                    <!-- Domain Expiration Card -->
                    <div class="bg-surface-2 rounded-lg p-3 border border-line">
                        <Badge color={expiration?.expired ? 'red' : expiration?.isCritical ? 'red' : expiration?.isUrgent ? 'yellow' : 'green'} class="text-sm font-medium mb-2">
                            Expires
                        </Badge>
                        <p class="text-lg font-bold {expiration?.expired ? 'text-bad-400' : expiration?.isCritical ? 'text-bad-400' : expiration?.isUrgent ? 'text-warn-400' : 'text-fg'}">
                            {#if expiration}
                                {#if expiration.expired}
                                    Expired
                                {:else}
                                    {expiration.months} months, {expiration.days} days
                                {/if}
                            {:else}
                                <span class="text-fg-subtle">Unknown</span>
                            {/if}
                        </p>
                        <p class="text-xs text-fg-muted">
                            {#if expiration}
                                Expires {expiration.expirationDate}
                            {:else}
                                Expiration date unknown
                            {/if}
                        </p>
                    </div>

                    <!-- Registrar Card -->
                    <div class="bg-surface-2 rounded-lg p-3 border border-line">
                        <Badge color="purple" class="text-sm font-medium mb-2">
                            Registrar
                        </Badge>
                        <p class="text-lg font-bold text-fg truncate" title={registrar || domain.toolState.rdap.data?.registrar || 'Unknown'}>
                            {#if registrar || domain.toolState.rdap.data?.registrar}
                                {registrar || domain.toolState.rdap.data?.registrar}
                            {:else}
                                <span class="text-fg-subtle">Unknown</span>
                            {/if}
                        </p>
                        <p class="text-xs text-fg-muted">
                            Domain registrar
                        </p>
                    </div>

                    <!-- DNSSEC Card -->
                    <div class="bg-surface-2 rounded-lg p-3 border border-line">
                        <Badge color={domain.toolState.rdap.data?.dnssecEnabled ? 'green' : 'red'} class="text-sm font-medium mb-2">
                            DNSSEC
                        </Badge>
                        <p class="text-lg font-bold text-fg">
                            {domain.toolState.rdap.data?.dnssecEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                        <p class="text-xs text-fg-muted">
                            {#if domain.toolState.rdap.data?.dnssecEnabled}
                                Domain signatures verified
                            {:else}
                                No DNSSEC protection
                            {/if}
                        </p>
                    </div>
                </div>
            </div>
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
